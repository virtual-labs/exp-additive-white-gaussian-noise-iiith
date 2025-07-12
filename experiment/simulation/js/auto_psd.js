// --------------------------------------
// 1. References & Global Variables
// --------------------------------------
const autocorrelationChartCtx = document.getElementById("autocorrelationChart").getContext("2d");
const psdChartCtx = document.getElementById("psdChart").getContext("2d");

let autocorrelationChart, psdChart;
let noiseSignal = [];
let psdData = [];

// Controls
let noisePower = 1.0;
const SIGNAL_LENGTH = 1024; // Must be a power of 2 for FFT

// DOM Elements
const noisePowerSlider = document.getElementById("noisePower"), noisePowerVal = document.getElementById("noisePowerVal");
const generateBtn = document.getElementById("generateBtn");
const startFreqSlider = document.getElementById("startFreq"), endFreqSlider = document.getElementById("endFreq");
const startFreqVal = document.getElementById("startFreqVal"), endFreqVal = document.getElementById("endFreqVal");
const observationsDiv = document.getElementById("observations");

// --------------------------------------
// 2. Utility & DSP Functions
// --------------------------------------
function generateGaussianNoise(length, stdDev) {
    const noise = new Array(length);
    for (let i = 0; i < length; i++) {
        // Box-Muller transform to get a true Gaussian distribution
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        noise[i] = z * stdDev;
    }
    return noise;
}

function calculateAutocorrelation(signal) {
    const N = signal.length;
    const acf = new Array(N).fill(0);
    for (let tau = 0; tau < N; tau++) {
        let sum = 0;
        for (let i = 0; i < N - tau; i++) {
            sum += signal[i] * signal[i + tau];
        }
        acf[tau] = sum / (N - tau);
    }
    return acf;
}

// Basic FFT implementation (Cooley-Tukey)
function fft(signal) {
    const N = signal.length;
    if (N <= 1) return [{re: signal[0], im: 0}];

    const even = fft(signal.filter((_, i) => i % 2 === 0));
    const odd = fft(signal.filter((_, i) => i % 2 !== 0));

    const result = new Array(N);
    for (let k = 0; k < N / 2; k++) {
        const t = odd[k];
        const angle = -2 * Math.PI * k / N;
        const c = { re: Math.cos(angle), im: Math.sin(angle) };
        const product = { re: t.re * c.re - t.im * c.im, im: t.re * c.im + t.im * c.re };
        
        result[k] = { re: even[k].re + product.re, im: even[k].im + product.im };
        result[k + N / 2] = { re: even[k].re - product.re, im: even[k].im - product.im };
    }
    return result;
}

// --------------------------------------
// 3. Chart Initialization
// --------------------------------------
function initializeCharts() {
    if (autocorrelationChart) autocorrelationChart.destroy();
    autocorrelationChart = new Chart(autocorrelationChartCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Sample Autocorrelation', data: [], borderColor: 'rgba(220, 20, 60, 0.8)', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Time Lag (τ)' }}, y: { title: { display: true, text: 'Correlation' }}}}
    });

    if (psdChart) psdChart.destroy();
    psdChart = new Chart(psdChartCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'Power Spectral Density', data: [], borderColor: 'rgba(30, 144, 255, 0.8)', stepp: true }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Frequency (Hz)' }}, y: { title: { display: true, text: 'Power' }}}}
    });
}

// --------------------------------------
// 4. Main Simulation & Update Logic
// --------------------------------------
function runFullAnalysis() {
    // 1. Generate Signal
    const stdDev = Math.sqrt(noisePower);
    noiseSignal = generateGaussianNoise(SIGNAL_LENGTH, stdDev);

    // 2. Calculate Autocorrelation
    const acf = calculateAutocorrelation(noiseSignal);
    
    // 3. Calculate PSD
    const fftResult = fft(noiseSignal);
    psdData = fftResult.slice(0, SIGNAL_LENGTH / 2).map(c => (c.re * c.re + c.im * c.im) / SIGNAL_LENGTH);

    // 4. Update all visuals
    updateAutocorrelationChart(acf);
    updatePsdChart();
    updateObservations();
}

// --------------------------------------
// 5. Update & Drawing Functions
// --------------------------------------
function updateAutocorrelationChart(acf) {
    const maxLag = 50; // Show only a small portion of lags
    const labels = Array.from({length: maxLag}, (_, i) => i);
    autocorrelationChart.data.labels = labels;
    autocorrelationChart.data.datasets[0].data = acf.slice(0, maxLag);
    autocorrelationChart.update();
}

function updatePsdChart() {
    const labels = Array.from({length: psdData.length}, (_, i) => i);
    psdChart.data.labels = labels;
    psdChart.data.datasets[0].data = psdData;

    // Add visual for frequency band selection
    const startFreq = parseInt(startFreqSlider.value);
    const endFreq = parseInt(endFreqSlider.value);
    const backgroundColors = labels.map(i => (i >= startFreq && i <= endFreq) ? 'rgba(30, 144, 255, 0.3)' : 'transparent');
    psdChart.data.datasets[0].backgroundColor = backgroundColors;
    psdChart.data.datasets[0].fill = 'start';
    psdChart.update();
}

function updateObservations() {
    // Total Power (Parseval's Theorem check)
    const totalPower = psdData.reduce((a, b) => a + b, 0);

    // Power in selected band
    const startFreq = parseInt(startFreqSlider.value);
    const endFreq = parseInt(endFreqSlider.value);
    const bandPower = psdData.slice(startFreq, endFreq + 1).reduce((a, b) => a + b, 0);
    
    observationsDiv.innerHTML = `
        <p><strong>Total Signal Power (from PSD):</strong> ${totalPower.toFixed(4)}</p>
        <p><strong>Selected Bandwidth:</strong> ${endFreq - startFreq} Hz</p>
        <p><strong>Power in Selected Band:</strong> ${bandPower.toFixed(4)}</p>`;
}

// --------------------------------------
// 6. Event Handlers
// --------------------------------------
generateBtn.addEventListener('click', runFullAnalysis);
noisePowerSlider.oninput = () => { noisePower = parseFloat(noisePowerSlider.value); noisePowerVal.textContent = noisePower.toFixed(1); };
startFreqSlider.oninput = () => { startFreqVal.textContent = startFreqSlider.value; if (parseInt(endFreqSlider.value) <= parseInt(startFreqSlider.value)) { endFreqSlider.value = parseInt(startFreqSlider.value) + 1; endFreqVal.textContent = endFreqSlider.value;} updatePsdChart(); updateObservations(); };
endFreqSlider.oninput = () => { endFreqVal.textContent = endFreqSlider.value; if (parseInt(endFreqSlider.value) <= parseInt(startFreqSlider.value)) { startFreqSlider.value = parseInt(endFreqSlider.value) - 1; startFreqVal.textContent = startFreqSlider.value;} updatePsdChart(); updateObservations(); };


// --------------------------------------
// 7. Initial Load
// --------------------------------------
window.addEventListener("load", () => {
    noisePowerVal.textContent = parseFloat(noisePowerSlider.value).toFixed(1);
    startFreqVal.textContent = startFreqSlider.value;
    endFreqVal.textContent = endFreqSlider.value;
    
    initializeCharts();
    runFullAnalysis();
});