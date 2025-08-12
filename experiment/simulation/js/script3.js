// --------------------------------------
// 1. DOM and Chart References
// --------------------------------------
const bitInput = document.getElementById('bit-input');
const noiseSlider = document.getElementById('noise-slider');
const noiseValueSpan = document.getElementById('noise-value');
const transmittedBitsP = document.getElementById('transmitted-bits');
const decodedBitsP = document.getElementById('decoded-bits');
const observationsDiv = document.getElementById('observations');

const cleanCtx = document.getElementById('cleanSignalChart').getContext('2d');
const noiseCtx = document.getElementById('noiseSignalChart').getContext('2d');
const noisyCtx = document.getElementById('noisySignalChart').getContext('2d');
const constCtx = document.getElementById('constellationChart').getContext('2d');

let cleanChart, noiseChart, noisyChart, constChart;
let lastHoveredBit = -1;

// --------------------------------------
// 2. Simulation Config
// --------------------------------------
const SAMPLES_PER_BIT = 32;
const BPSK_MAP = { '0': -1, '1': 1 }; // BPSK: 0 maps to -1V, 1 maps to +1V

// --------------------------------------
// 3. Helper Functions
// --------------------------------------
function generateGaussianNoise(variance, n) {
    const noise = new Float32Array(n);
    const stdDev = Math.sqrt(variance);
    for (let i = 0; i < n; i++) {
        let u1 = Math.random();
        let u2 = Math.random();
        let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        noise[i] = z * stdDev;
    }
    return noise;
}

// --------------------------------------
// 4. Main Simulation Logic
// --------------------------------------
function runSimulation() {
    // Sanitize input to only include 0s and 1s
    const originalBits = bitInput.value.replace(/[^01]/g, '');

    if (originalBits.length === 0) {
        transmittedBitsP.textContent = '---';
        decodedBitsP.innerHTML = '---';
        observationsDiv.innerHTML = `<p class="initial">Enter a binary stream (e.g., 101101) into the input box to start the simulation.</p>`;
        updateAllPlots({ cleanSignal: [], noiseSignal: [], noisySignal: [], receivedPoints: [] });
        return;
    }

    // MODIFIED: Removed arbitrary 5-bit grouping
    transmittedBitsP.textContent = originalBits;

    const totalSamples = originalBits.length * SAMPLES_PER_BIT;
    const cleanSignal = new Float32Array(totalSamples);

    for (let i = 0; i < originalBits.length; i++) {
        const level = BPSK_MAP[originalBits[i]];
        for (let j = 0; j < SAMPLES_PER_BIT; j++) {
            cleanSignal[i * SAMPLES_PER_BIT + j] = level;
        }
    }

    const noiseVariance = parseFloat(noiseSlider.value);
    noiseValueSpan.textContent = noiseVariance.toFixed(2);
    const noiseSignal = generateGaussianNoise(noiseVariance, totalSamples);
    const noisySignal = cleanSignal.map((val, i) => val + noiseSignal[i]);

    const receivedPoints = [];
    for (let i = 0; i < originalBits.length; i++) {
        const sampleIdx = i * SAMPLES_PER_BIT + Math.floor(SAMPLES_PER_BIT / 2);
        receivedPoints.push({ x: noisySignal[sampleIdx], y: 0 }); // y=0 for 1D plot
    }

    let decodedBits = '';
    receivedPoints.forEach(point => {
        decodedBits += (point.x > 0) ? '1' : '0';
    });
    
    let comparisonHTML = '';
    let errorCount = 0;
    for(let i = 0; i < originalBits.length; i++) {
        if(originalBits[i] === decodedBits[i]) {
            comparisonHTML += decodedBits[i];
        } else {
            comparisonHTML += `<span class="error">${decodedBits[i]}</span>`;
            errorCount++;
        }
    }
    // MODIFIED: Removed arbitrary 5-bit grouping
    decodedBitsP.innerHTML = comparisonHTML;

    // MODIFIED: Improved and more descriptive observation messages
    if (errorCount === 0) {
        observationsDiv.innerHTML = `<p class="correct">✔️ <strong>No Errors Detected (BER: 0%)</strong><br>At a noise power of σ² = ${noiseVariance.toFixed(2)}, the noise was not strong enough to push any received signal point past the 0V decision boundary. The message was recovered perfectly.</p>`;
    } else {
        const ber = (errorCount / originalBits.length * 100).toFixed(2);
        observationsDiv.innerHTML = `<p class="incorrect">❌ <strong>${errorCount} Error(s) Detected (BER: ${ber}%)</strong><br>At a noise power of σ² = ${noiseVariance.toFixed(2)}, the noise was large enough to flip ${errorCount} bit(s). See how the red "Received Signal" crosses the center line, causing the receiver to misinterpret the original bit.</p>`;
    }
    
    updateAllPlots({ cleanSignal, noiseSignal, noisySignal, receivedPoints });
}

// --------------------------------------
// 5. Plotting Functions
// --------------------------------------
function updateAllPlots(data) {
    const labels = Array.from({ length: data.cleanSignal.length }, (_, i) => i);
    const yAxisRange = 3.5;
    
    cleanChart.options.scales.y.min = -yAxisRange;
    cleanChart.options.scales.y.max = yAxisRange;
    cleanChart.data.labels = labels;
    cleanChart.data.datasets[0].data = data.cleanSignal;
    cleanChart.update('none');

    noiseChart.options.scales.y.min = -yAxisRange;
    noiseChart.options.scales.y.max = yAxisRange;
    noiseChart.data.labels = labels;
    noiseChart.data.datasets[0].data = data.noiseSignal;
    noiseChart.update('none');

    noisyChart.options.scales.y.min = -yAxisRange;
    noisyChart.options.scales.y.max = yAxisRange;
    noisyChart.data.labels = labels;
    noisyChart.data.datasets[0].data = data.noisySignal;
    noisyChart.data.datasets[1].data = data.cleanSignal;
    noisyChart.update('none');

    constChart.data.datasets[1].data = data.receivedPoints;
    constChart.update('none');
}

function initializeCharts() {
    const timeDomainOptions = { responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { title: { display: true, text: 'Time (samples)' } }, y: { min: -3.5, max: 3.5 } }, plugins:{legend:{display:false}} };
    const constellationOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { min: -3.5, max: 3.5, title: { display: true, text: 'Decision Voltage' } }, y: { display: false } } };

    cleanChart = new Chart(cleanCtx, { type: 'line', data: { datasets: [{ data: [], borderColor: '#1E88E5', borderWidth: 2.5, pointRadius: 0, stepp: 'before' }] }, options: timeDomainOptions });
    noiseChart = new Chart(noiseCtx, { type: 'line', data: { datasets: [{ data: [], borderColor: '#757575', borderWidth: 1, pointRadius: 0 }] }, options: timeDomainOptions });
    noisyChart = new Chart(noisyCtx, { type: 'line', data: { datasets: [ 
        { label: 'Received', data: [], borderColor: '#D81B60', borderWidth: 2, pointRadius: 0 }, 
        { label: 'Transmitted', data: [], borderColor: 'rgba(0, 0, 0, 0.2)', borderWidth: 2.5, pointRadius: 0, borderDash: [5, 5], stepp: 'before' } 
    ]}, options: timeDomainOptions });
    
    constChart = new Chart(constCtx, { type: 'scatter', options: constellationOptions, data: { datasets: [ 
        // MODIFIED: Dataset 0: Made ideal points darker and thicker for visibility
        { label: 'Ideal', data: [{x:-1, y:0}, {x:1, y:0}], pointStyle: 'crossRot', radius: 15, borderWidth: 6, borderColor: '#222' },
        // Dataset 1: Received Points
        { label: 'Received', data: [], backgroundColor: '#3273dc', radius: 6 },
        // Dataset 2: Decision Boundary Line
        { label: 'Boundary', data: [{x:0, y:-1}, {x:0, y:1}], borderColor: 'rgba(255, 62, 96, 0.6)', borderWidth: 2, borderDash:[10,5], showLine: true, pointRadius: 0, type: 'line' }
    ]}});
}

// --------------------------------------
// 6. Event Listeners
// --------------------------------------
bitInput.addEventListener('input', runSimulation);
noiseSlider.addEventListener('input', runSimulation);
window.addEventListener('load', () => {
    initializeCharts();
    runSimulation();
});