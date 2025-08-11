// --------------------------------------
// 1. DOM and Chart References
// --------------------------------------
const textInput = document.getElementById('text-input');
const noiseSlider = document.getElementById('noise-slider');
const noiseValueSpan = document.getElementById('noise-value');
const encodedBitsP = document.getElementById('encoded-bits');
const decodedMessageP = document.getElementById('decoded-message');

const cleanCtx = document.getElementById('cleanSignalChart').getContext('2d');
const noiseCtx = document.getElementById('noiseSignalChart').getContext('2d');
const noisyCtx = document.getElementById('noisySignalChart').getContext('2d');
const constCtx = document.getElementById('constellationChart').getContext('2d');

let cleanChart, noiseChart, noisyChart, constChart;
let lastHoveredBit = -1;

// --------------------------------------
// 2. Encoding & Simulation Config
// --------------------------------------
const SAMPLES_PER_BIT = 32;
const BPSK_MAP = { '0': -1, '1': 1 }; // BPSK: 0 maps to -1V, 1 maps to +1V

const LITE_ENCODING = {
    'A':'00000', 'B':'00001', 'C':'00010', 'D':'00011', 'E':'00100', 'F':'00101', 'G':'00110', 
    'H':'00111', 'I':'01000', 'J':'01001', 'K':'01010', 'L':'01011', 'M':'01100', 'N':'01101', 
    'O':'01110', 'P':'01111', 'Q':'10000', 'R':'10001', 'S':'10010', 'T':'10011', 'U':'10100', 
    'V':'10101', 'W':'10110', 'X':'10111', 'Y':'11000', 'Z':'11001', ' ':'11010'
};
// Create a reverse mapping for decoding
const LITE_DECODING = Object.fromEntries(Object.entries(LITE_ENCODING).map(a => a.reverse()));


// --------------------------------------
// 3. Helper Functions
// --------------------------------------
const textToBits = (text) => text.toUpperCase().split('').map(char => LITE_ENCODING[char] || '').join('');
const bitsToText = (bits) => {
    let text = '';
    for (let i = 0; i < bits.length; i += 5) {
        const fiveBits = bits.substr(i, 5);
        if (fiveBits.length === 5) text += LITE_DECODING[fiveBits] || '_';
    }
    return text;
};

function generateGaussianNoise(variance, n) {
    const noise = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        // Box-Muller transform for more standard results
        let u1 = Math.random();
        let u2 = Math.random();
        let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        noise[i] = z * Math.sqrt(variance);
    }
    return noise;
}

// --------------------------------------
// 4. Main Simulation Logic
// --------------------------------------
function runSimulation() {
    const message = textInput.value;
    if (message.length === 0) {
        encodedBitsP.textContent = '---';
        decodedMessageP.innerHTML = '---';
        updateAllPlots({ cleanSignal: [], noiseSignal: [], noisySignal: [], receivedPoints: [] });
        return;
    }
    
    const bits = textToBits(message);
    const numBits = bits.length;
    encodedBitsP.textContent = bits.replace(/(\d{5})/g, '$1 ').trim();

    const totalSamples = numBits * SAMPLES_PER_BIT;
    const cleanSignal = new Float32Array(totalSamples);

    for (let i = 0; i < numBits; i++) {
        const bit = bits[i];
        const level = BPSK_MAP[bit];
        for (let j = 0; j < SAMPLES_PER_BIT; j++) {
            cleanSignal[i * SAMPLES_PER_BIT + j] = level;
        }
    }

    const noiseVariance = parseFloat(noiseSlider.value);
    noiseValueSpan.textContent = noiseVariance.toFixed(2);
    const noiseSignal = generateGaussianNoise(noiseVariance, totalSamples);
    const noisySignal = cleanSignal.map((val, i) => val + noiseSignal[i]);

    const receivedPoints = [];
    for (let i = 0; i < numBits; i++) {
        const sampleIdx = i * SAMPLES_PER_BIT + Math.floor(SAMPLES_PER_BIT / 2);
        receivedPoints.push({ x: noisySignal[sampleIdx], y: 0 }); // y=0 for 1D plot
    }

    let decodedBits = '';
    receivedPoints.forEach(point => {
        // Decision boundary is at 0. If > 0, it's a '1', else '0'.
        decodedBits += (point.x > 0) ? '1' : '0';
    });
    
    const originalText = message.toUpperCase();
    const decodedMessage = bitsToText(decodedBits);
    let comparisonHTML = '';
    for(let i = 0; i < originalText.length; i++) {
        if(originalText[i] === decodedMessage[i]) {
            comparisonHTML += decodedMessage[i] || '_';
        } else {
            comparisonHTML += `<span class="error">${decodedMessage[i] || '_'}</span>`;
        }
    }
    decodedMessageP.innerHTML = comparisonHTML;

    updateAllPlots({ cleanSignal, noiseSignal, noisySignal, receivedPoints });
}

// --------------------------------------
// 5. Plotting Functions
// --------------------------------------
function updateAllPlots(data) {
    const labels = Array.from({ length: data.cleanSignal.length }, (_, i) => i);
    
    cleanChart.data.labels = labels;
    cleanChart.data.datasets[0].data = data.cleanSignal;
    cleanChart.update('none');

    noiseChart.data.labels = labels;
    noiseChart.data.datasets[0].data = data.noiseSignal;
    noiseChart.update('none');

    noisyChart.data.labels = labels;
    noisyChart.data.datasets[0].data = data.noisySignal;
    noisyChart.data.datasets[1].data = data.cleanSignal; // Show clean as reference
    noisyChart.update('none');

    constChart.data.datasets[1].data = data.receivedPoints; // Received points
    constChart.update('none');
}

function initializeCharts() {
    const timeDomainOptions = { responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { title: { display: true, text: 'Time (samples)' } }, y: { min: -2.5, max: 2.5 } }, plugins:{legend:{display:false}} };
    const constellationOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { min: -2.5, max: 2.5 }, y: { display: false } }, aspectRatio: 1 };

    const hoverOptions = {
        onHover: (event, chartElement) => {
            if (chartElement.length > 0) {
                const sampleIndex = chartElement[0].index;
                const bitIndex = Math.floor(sampleIndex / SAMPLES_PER_BIT);
                
                if (bitIndex !== lastHoveredBit) {
                    lastHoveredBit = bitIndex;
                    const dataset = constChart.data.datasets[1];
                    dataset.pointBackgroundColor = dataset.data.map((_, i) => i === bitIndex ? '#ff3860' : '#3273dc');
                    dataset.pointRadius = dataset.data.map((_, i) => i === bitIndex ? 8 : 5);
                    constChart.update('none');
                }
            }
        },
        hover: { mode: 'index', intersect: false },
        tooltips: { enabled: false }
    };

    cleanChart = new Chart(cleanCtx, { type: 'line', options: timeDomainOptions, data: { datasets: [{ data: [], borderColor: '#1E88E5', borderWidth: 2.5, pointRadius: 0 }] } });
    noiseChart = new Chart(noiseCtx, { type: 'line', options: timeDomainOptions, data: { datasets: [{ data: [], borderColor: '#757575', borderWidth: 1, pointRadius: 0 }] } });
    noisyChart = new Chart(noisyCtx, { type: 'line', options: {...timeDomainOptions, ...hoverOptions }, data: { datasets: [ 
        { label: 'Received', data: [], borderColor: '#D81B60', borderWidth: 2, pointRadius: 0 }, 
        { label: 'Transmitted', data: [], borderColor: 'rgba(0, 0, 0, 0.2)', borderWidth: 2.5, pointRadius: 0, borderDash: [5, 5] } 
    ]}});
    
    constChart = new Chart(constCtx, { type: 'scatter', options: constellationOptions, data: { datasets: [ 
        // Dataset 0: Ideal Points
        { label: 'Ideal', data: [{x:-1, y:0}, {x:1, y:0}], pointStyle: 'crossRot', pointRadius: 15, borderWidth: 3, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
        // Dataset 1: Received Points
        { label: 'Received', data: [], backgroundColor: '#3273dc', pointRadius: 5 },
        // Dataset 2: Decision Boundary Line
        { label: 'Boundary', data: [{x:0, y:-1}, {x:0, y:1}], borderColor: 'rgba(0,0,0,0.4)', borderWidth: 2, borderDash:[10,5], showLine: true, pointRadius: 0, type: 'line' }
    ]}});
}

// --------------------------------------
// 6. Event Listeners
// --------------------------------------
textInput.addEventListener('input', runSimulation);
noiseSlider.addEventListener('input', runSimulation);
window.addEventListener('load', () => {
    initializeCharts();
    runSimulation();
});