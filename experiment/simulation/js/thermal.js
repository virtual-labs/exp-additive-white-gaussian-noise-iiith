// --------------------------------------
// 1. References & Global Variables
// --------------------------------------
const animationContainer = document.getElementById("animationContainer");
const conductorCanvas = document.getElementById("conductorCanvas");
const conductorCtx = conductorCanvas.getContext("2d");
const histogramChartCtx = document.getElementById("histogramChart").getContext("2d");

let histogramChart;
let electrons = [];
let noiseVoltageSamples = [];

// Physical Constants
const BOLTZMANN_K = 1.380649e-23; // J/K
const TEMPERATURE_K = 300; // K
const RESISTANCE_R = 50; // Ohms
const BANDWIDTH_B = 10e6; // Hz (10 MHz)

// Simulation Controls
let numElectrons = 200;
let simulationIsRunning = false;
let sampleCollectionInterval;

// DOM Elements
const electronsSlider = document.getElementById("electrons"), electronsVal = document.getElementById("electronsVal");
const startBtn = document.getElementById("startBtn"), stopBtn = document.getElementById("stopBtn"), resetBtn = document.getElementById("resetBtn");
const observationsDiv = document.getElementById("observations");

// --------------------------------------
// 2. Utility & Physics Functions
// --------------------------------------

/**
 * Calculates the theoretical Johnson-Nyquist noise variance.
 * The formula is Var = 4 * k * T * R * B.
 * The result is converted from Volts^2 to (microVolts)^2 by multiplying by 1e12.
 */
function calculateTheoreticalVariance() {
    const variance_volts_squared = 4 * BOLTZMANN_K * TEMPERATURE_K * RESISTANCE_R * BANDWIDTH_B;
    // Correctly calculated value is ~0.00828 (μV)^2
    return variance_volts_squared * 1e12; 
}

const THEORETICAL_VARIANCE = calculateTheoreticalVariance();
const THEORETICAL_STD_DEV = Math.sqrt(THEORETICAL_VARIANCE);

function gaussianPDF(x, mean, stdDev) {
    if (stdDev <= 0) return 0;
    const variance = stdDev * stdDev;
    return (1 / (Math.sqrt(2 * Math.PI * variance))) * Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
}

function calculateMeanAndStdDev(data) {
    if (data.length < 2) return { mean: 0, stdDev: 0 };
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdDev = Math.sqrt(data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (data.length - 1));
    return { mean, stdDev };
}

// --------------------------------------
// 3. Chart & Canvas Initialization
// --------------------------------------
function initializeHistogram() {
    if (histogramChart) histogramChart.destroy();
    histogramChart = new Chart(histogramChartCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                { label: 'Simulated Density', data: [], backgroundColor: 'rgba(30, 144, 255, 0.6)' },
                { label: `Theoretical Gaussian PDF`, data: [], type: 'line', borderColor: 'rgba(255, 159, 64, 1)', borderWidth: 3, pointRadius: 0, fill: false }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: "Noise Voltage (μV)" } },
                y: { title: { display: true, text: "Probability Density" }, beginAtZero: true }
            }
        }
    });
}

function resizeAndDrawConductor() {
    const container = document.getElementById('animationContainer');
    conductorCanvas.width = container.offsetWidth;
    conductorCanvas.height = container.offsetHeight;

    const w = conductorCanvas.width;
    const h = conductorCanvas.height;
    const conductorTop = h * 0.1;
    const conductorHeight = h * 0.8;

    conductorCtx.fillStyle = '#ffffffff';
    conductorCtx.fillRect(0, conductorTop, w, conductorHeight);

    conductorCtx.fillStyle = '#ffa600ff';
    conductorCtx.fillRect(0, conductorTop - 2, w, 4);
    conductorCtx.fillRect(0, conductorTop + conductorHeight, w, 4);
}

// --------------------------------------
// 4. Electron & Simulation Logic
// --------------------------------------
function createElectrons() {
    animationContainer.querySelectorAll('.electron-img').forEach(el => el.remove());
    electrons = [];
    
    const w = animationContainer.clientWidth, h = animationContainer.clientHeight;
    const conductorTop = h * 0.1;
    const conductorHeight = h * 0.7;

    for (let i = 0; i < numElectrons; i++) {
        const img = document.createElement('img');
        // Make sure you have an 'electron.png' image in a relative './images/' folder
        img.src = './images/electron.png'; 
        img.className = 'electron-img';
        
        const electronState = {
            el: img,
            x: Math.random() * w * 0.8,
            y: conductorTop + Math.random() * conductorHeight,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
        };
        img.style.left = `${electronState.x}px`;
        img.style.top = `${electronState.y}px`;
        
        electrons.push(electronState);
        animationContainer.appendChild(img);
    }
}

function updateElectrons() {
    const w = animationContainer.clientWidth, h = animationContainer.clientHeight;
    const conductorTop = h * 0.1, conductorBottom = h * 0.9;

    // --- PHYSICS CORRECTION ---
    // These values are calibrated to ensure the steady-state variance of vx is 1.
    const damping = 0.95;
    // Variance of (Math.random() - 0.5) is 1/12. We need Var(kick) = 1 - damping^2.
    // So (kick_amplitude^2)/12 = 1 - damping^2 => kick_amplitude = sqrt(12 * (1 - damping^2))
    const thermalKick = Math.sqrt(12 * (1 - damping * damping)); // This is ~1.08

    for (const e of electrons) {
        e.vx += (Math.random() - 0.5) * thermalKick;
        e.vy += (Math.random() - 0.5) * thermalKick;
        e.vx *= damping; 
        e.vy *= damping;
        e.x += e.vx; e.y += e.vy;

        // Periodic boundary conditions for horizontal movement
        if (e.x > w) e.x = 0;
        if (e.x < 0) e.x = w;

        // Reflective boundary conditions for vertical movement (confinement)
        if (e.y < conductorTop || e.y > conductorBottom) {
            e.vy *= -1;
            e.y = Math.max(conductorTop, Math.min(e.y, conductorBottom));
        }
        
        e.el.style.left = `${e.x}px`;
        e.el.style.top = `${e.y}px`;
    }
}

function collectVoltageSample() {
    if (electrons.length === 0) return;
    const sumOfVelocities = electrons.reduce((sum, e) => sum + e.vx, 0);
    
    // This scaling is now correct because Var(vx) is calibrated to 1.
    const scalingFactor = THEORETICAL_STD_DEV / Math.sqrt(numElectrons);
    
    const voltageSample = sumOfVelocities * scalingFactor;
    noiseVoltageSamples.push(voltageSample);
    updateHistogramChart();
    updateObservations();
}

// --------------------------------------
// 5. Main Loop & Event Handlers
// --------------------------------------
function simulationLoop() {
    if (!simulationIsRunning) return;
    updateElectrons();
    requestAnimationFrame(simulationLoop);
}

startBtn.addEventListener('click', () => {
    if (simulationIsRunning) return;
    simulationIsRunning = true;
    startBtn.disabled = true; stopBtn.disabled = false; electronsSlider.disabled = true;
    sampleCollectionInterval = setInterval(collectVoltageSample, 100);
    simulationLoop();
});

stopBtn.addEventListener('click', () => {
    simulationIsRunning = false;
    startBtn.disabled = false; stopBtn.disabled = true; electronsSlider.disabled = false;
    clearInterval(sampleCollectionInterval);
});

resetBtn.addEventListener('click', () => {
    simulationIsRunning = false;
    startBtn.disabled = false; stopBtn.disabled = true; electronsSlider.disabled = false;
    clearInterval(sampleCollectionInterval);
    numElectrons = parseInt(electronsSlider.value);
    noiseVoltageSamples = [];
    createElectrons();
    initializeHistogram(); // Re-initialize to clear data
    updateObservations();
});

electronsSlider.oninput = () => {
    numElectrons = parseInt(electronsSlider.value);
    electronsVal.textContent = numElectrons;
    resetBtn.click();
};

// --------------------------------------
// 6. Update & Drawing Functions
// --------------------------------------
function updateHistogramChart() {
    if (noiseVoltageSamples.length < 20) {
        return; // Don't draw if not enough samples
    }

    const stableMin = -4 * THEORETICAL_STD_DEV, stableMax = 4 * THEORETICAL_STD_DEV;
    const numBins = 50;
    const binWidth = (stableMax - stableMin) / numBins;
    if (binWidth <= 0) return;

    const bins = new Array(numBins).fill(0);
    const labels = bins.map((_, i) => (stableMin + (i + 0.5) * binWidth)); // Use bin center for PDF calc
    
    noiseVoltageSamples.forEach(v => {
        const binIndex = Math.floor((v - stableMin) / binWidth);
        if (binIndex >= 0 && binIndex < numBins) bins[binIndex]++;
    });

    const totalSamples = noiseVoltageSamples.length;
    const densityData = bins.map(count => count / (totalSamples * binWidth));
    const theoreticalData = labels.map(label => gaussianPDF(label, 0, THEORETICAL_STD_DEV));
    
    // Use bin edges for labels for better chart appearance
    histogramChart.data.labels = labels.map(l => l.toFixed(4));
    histogramChart.data.datasets[0].data = densityData;
    histogramChart.data.datasets[1].data = theoreticalData;
    histogramChart.update();
}

function updateObservations() {
    const { mean, stdDev } = calculateMeanAndStdDev(noiseVoltageSamples);
    const sampleVariance = stdDev * stdDev;
    observationsDiv.innerHTML = `
        <div class="columns is-centered">
            <div class="column has-text-centered">
                <h5 class="is-size-5 has-text-weight-semibold">Theoretical Values</h5>
                <p>Mean (μ): 0.00 μV</p>
                <p>Variance (σ²): ${THEORETICAL_VARIANCE.toFixed(5)} (μV)²</p>
            </div>
            <div class="column has-text-centered">
                <h5 class="is-size-5 has-text-weight-semibold">Simulated Values</h5>
                <p>Samples: ${noiseVoltageSamples.length}</p>
                <p>Sample Mean: ${mean.toFixed(5)} μV</p>
                <p>Sample Variance: ${sampleVariance.toFixed(5)} (μV)²</p>
            </div>
        </div>`;
}

// --------------------------------------
// 7. Initial Load
// --------------------------------------
window.addEventListener("load", () => {
    electronsVal.textContent = electronsSlider.value;
    numElectrons = parseInt(electronsSlider.value);
    resizeAndDrawConductor();
    initializeHistogram();
    createElectrons();
    updateObservations();
    stopBtn.disabled = true;
});

window.addEventListener('resize', () => {
    resizeAndDrawConductor();
    // Re-creating electrons on resize might be disruptive, consider just redrawing positions.
    // For simplicity, we stick to the original logic.
    resetBtn.click(); 
});