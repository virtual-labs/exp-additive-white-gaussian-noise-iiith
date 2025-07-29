// --------------------------------------
// 1. DOM and Chart References
// --------------------------------------
const textInput = document.getElementById('text-input');
const modulationSelect = document.getElementById('modulation-select');
const noiseSlider = document.getElementById('noise-slider');
const noiseValueSpan = document.getElementById('noise-value');
const encodedBitsP = document.getElementById('encoded-bits');
const decodedMessageP = document.getElementById('decoded-message');

const cleanCtx = document.getElementById('cleanSignalChart').getContext('2d');
const noiseCtx = document.getElementById('noiseSignalChart').getContext('2d');
const noisyCtx = document.getElementById('noisySignalChart').getContext('2d');
const constCtx = document.getElementById('constellationChart').getContext('2d');

let cleanChart, noiseChart, noisyChart, constChart;
let lastHoveredSymbol = -1;

// --------------------------------------
// 2. Modulation & Simulation Config
// --------------------------------------
const SAMPLES_PER_SYMBOL = 32;
const MODULATORS = {
    'qpsk': {
        bitsPerSymbol: 2,
        points: [ {x: 1, y: 1}, {x: -1, y: 1}, {x: -1, y: -1}, {x: 1, y: -1} ].map(p => ({x:p.x/Math.sqrt(2), y:p.y/Math.sqrt(2)}))
    },
    '16qam': {
        bitsPerSymbol: 4,
        points: [
            {x: -3, y: 3}, {x: -3, y: 1}, {x: -3, y: -1}, {x: -3, y: -3},
            {x: -1, y: 3}, {x: -1, y: 1}, {x: -1, y: -1}, {x: -1, y: -3},
            {x: 1, y: 3}, {x: 1, y: 1}, {x: 1, y: -1}, {x: 1, y: -3},
            {x: 3, y: 3}, {x: 3, y: 1}, {x: 3, y: -1}, {x: 3, y: -3}
        ].map(p => ({x:p.x/Math.sqrt(10), y:p.y/Math.sqrt(10)}))
    }
};

// --------------------------------------
// 3. Helper Functions
// --------------------------------------
const textToBits = (text) => text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
const bitsToText = (bits) => {
    let text = '';
    for (let i = 0; i < bits.length; i += 8) {
        const byte = bits.substr(i, 8);
        if (byte.length === 8) text += String.fromCharCode(parseInt(byte, 2));
    }
    return text;
};

function generateGaussianNoise(variance, n) {
    const noise = new Float32Array(n);
    for (let i = 0; i < n; i += 2) {
        let u1 = 0, u2 = 0;
        while(u1 === 0) u1 = Math.random();
        while(u2 === 0) u2 = Math.random();
        const R = Math.sqrt(-2.0 * Math.log(u1));
        const T = 2.0 * Math.PI * u2;
        const z1 = R * Math.cos(T);
        const z2 = R * Math.sin(T);
        const stdDev = Math.sqrt(variance);
        noise[i] = z1 * stdDev;
        if(i + 1 < n) noise[i+1] = z2 * stdDev;
    }
    return noise;
}

// --------------------------------------
// 4. Main Simulation Logic
// --------------------------------------
function runSimulation() {
    // --- FIX: Handle empty input correctly ---
    const message = textInput.value;
    if (message.length === 0) {
        encodedBitsP.textContent = '';
        decodedMessageP.innerHTML = '';
        // Clear all plots
        updateAllPlots({
            cleanI: [], cleanQ: [], noiseI: [], noiseQ: [],
            noisyI: [], noisyQ: [], idealPoints: [], receivedPoints: []
        });
        return; // Exit the function early
    }
    
    const modulator = MODULATORS[modulationSelect.value];
    const bits = textToBits(message);
    const numSymbols = Math.ceil(bits.length / modulator.bitsPerSymbol);
    encodedBitsP.textContent = bits.replace(/(\d{4})/g, '$1 ').trim();

    const totalSamples = numSymbols * SAMPLES_PER_SYMBOL;
    const cleanSignalI = new Float32Array(totalSamples);
    const cleanSignalQ = new Float32Array(totalSamples);

    for (let i = 0; i < numSymbols; i++) {
        const bitChunk = bits.substr(i * modulator.bitsPerSymbol, modulator.bitsPerSymbol).padEnd(modulator.bitsPerSymbol, '0');
        const symbolIndex = parseInt(bitChunk, 2);
        const point = modulator.points[symbolIndex];
        for (let j = 0; j < SAMPLES_PER_SYMBOL; j++) {
            const sampleIdx = i * SAMPLES_PER_SYMBOL + j;
            cleanSignalI[sampleIdx] = point.x;
            cleanSignalQ[sampleIdx] = point.y;
        }
    }

    const noiseVariance = parseFloat(noiseSlider.value);
    noiseValueSpan.textContent = noiseVariance.toFixed(3);
    const noiseI = generateGaussianNoise(noiseVariance, totalSamples);
    const noiseQ = generateGaussianNoise(noiseVariance, totalSamples);

    const noisySignalI = cleanSignalI.map((val, i) => val + noiseI[i]);
    const noisySignalQ = cleanSignalQ.map((val, i) => val + noiseQ[i]);

    const receivedSymbols = [];
    for (let i = 0; i < numSymbols; i++) {
        const sampleIdx = i * SAMPLES_PER_SYMBOL + Math.floor(SAMPLES_PER_SYMBOL / 2);
        receivedSymbols.push({ x: noisySignalI[sampleIdx], y: noisySignalQ[sampleIdx] });
    }

    let decodedBits = '';
    receivedSymbols.forEach(point => {
        let minDist = Infinity;
        let bestIndex = 0;
        modulator.points.forEach((idealPoint, index) => {
            const dist = Math.sqrt(Math.pow(point.x - idealPoint.x, 2) + Math.pow(point.y - idealPoint.y, 2));
            if (dist < minDist) {
                minDist = dist;
                bestIndex = index;
            }
        });
        decodedBits += bestIndex.toString(2).padStart(modulator.bitsPerSymbol, '0');
    });
    
    const decodedMessage = bitsToText(decodedBits);
    let comparisonHTML = '';
    for(let i=0; i<message.length; i++) {
        if(message[i] === decodedMessage[i]) {
            comparisonHTML += decodedMessage[i] || '_';
        } else {
            comparisonHTML += `<span class="error">${decodedMessage[i] || '_'}</span>`;
        }
    }
    decodedMessageP.innerHTML = comparisonHTML;

    updateAllPlots({ cleanI: cleanSignalI, cleanQ: cleanSignalQ, noiseI, noiseQ, noisyI: noisySignalI, noisyQ: noisySignalQ, idealPoints: modulator.points, receivedPoints: receivedSymbols });
}

// --------------------------------------
// 5. Plotting Functions
// --------------------------------------
function updateAllPlots(data) {
    const labels = Array.from({ length: data.cleanI.length }, (_, i) => i);
    
    const maxVal = data.cleanI.length > 0 ? Math.max(...data.cleanI, ...data.cleanQ) : 1;
    const minVal = data.cleanI.length > 0 ? Math.min(...data.cleanI, ...data.cleanQ) : -1;
    cleanChart.options.scales.y.max = maxVal + 0.5;
    cleanChart.options.scales.y.min = minVal - 0.5;

    cleanChart.data.labels = labels;
    cleanChart.data.datasets[0].data = data.cleanI;
    cleanChart.data.datasets[1].data = data.cleanQ;
    cleanChart.update('none');

    noiseChart.data.labels = labels;
    noiseChart.data.datasets[0].data = data.noiseI;
    noiseChart.data.datasets[1].data = data.noiseQ;
    noiseChart.update('none');

    noisyChart.data.labels = labels;
    noisyChart.data.datasets[0].data = data.noisyI;
    noisyChart.data.datasets[1].data = data.cleanI;
    noisyChart.update('none');

    constChart.data.datasets[0].data = data.idealPoints;
    constChart.data.datasets[1].data = data.receivedPoints;
    constChart.update('none');
}

function initializeCharts() {
    const timeDomainOptions = { responsive: true, maintainAspectRatio: false, animation: false, scales: { x: { title: { display: true, text: 'Time (samples)' } }, y: { suggestedMin: -2, suggestedMax: 2 } } };
    const constellationOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { min: -2, max: 2 }, y: { min: -2, max: 2 } }, aspectRatio: 1 };

    const hoverOptions = {
        onHover: (event, chartElement) => {
            const chart = event.chart;
            if (chartElement.length > 0) {
                const sampleIndex = chartElement[0].index;
                const symbolIndex = Math.floor(sampleIndex / SAMPLES_PER_SYMBOL);
                
                if (symbolIndex !== lastHoveredSymbol) {
                    lastHoveredSymbol = symbolIndex;
                    const constDataset = constChart.data.datasets[1];
                    
                    const radii = constDataset.data.map((_, i) => i === symbolIndex ? 10 : 4);
                    const colors = constDataset.data.map((_, i) => i === symbolIndex ? 'rgba(255, 26, 104, 1)' : 'rgba(255, 26, 104, 0.3)');

                    constDataset.pointRadius = radii;
                    constDataset.backgroundColor = colors;
                    constChart.update('none');
                }
            } else if (lastHoveredSymbol !== -1) {
                lastHoveredSymbol = -1;
                const constDataset = constChart.data.datasets[1];
                constDataset.pointRadius = 5;
                constDataset.backgroundColor = 'rgba(255, 26, 104, 1)';
                constChart.update('none');
            }
        },
        hover: { mode: 'index', intersect: false },
        tooltips: { enabled: false }
    };

    cleanChart = new Chart(cleanCtx, { type: 'line', options: timeDomainOptions, data: { datasets: [ { label: 'I-channel', data: [], borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 2.5, pointRadius: 0 }, { label: 'Q-channel', data: [], borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 2.5, pointRadius: 0 } ] } });
    noiseChart = new Chart(noiseCtx, { type: 'line', options: timeDomainOptions, data: { datasets: [ { label: 'I-channel', data: [], borderColor: 'rgba(54, 162, 235, 0.8)', borderWidth: 1, pointRadius: 0 }, { label: 'Q-channel', data: [], borderColor: 'rgba(255, 99, 132, 0.8)', borderWidth: 1, pointRadius: 0 } ] } });
    noisyChart = new Chart(noisyCtx, { type: 'line', options: {...timeDomainOptions, ...hoverOptions }, data: { datasets: [ { label: 'Noisy I-Signal', data: [], borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 2, pointRadius: 0 }, { label: 'Clean I-Signal (Ref)', data: [], borderColor: 'rgba(0, 0, 0, 0.2)', borderWidth: 2.5, pointRadius: 0, borderDash: [5, 5] } ] } });
    
    constChart = new Chart(constCtx, { type: 'scatter', options: constellationOptions, data: { datasets: [ 
        { label: 'Ideal Points', data: [], backgroundColor: 'rgba(100, 100, 100, 0.7)', pointRadius: 12, pointStyle: 'crossRot', borderWidth: 3 }, 
        { label: 'Received Points', data: [], backgroundColor: 'rgba(255, 26, 104, 1)', pointRadius: 5 } 
    ]}});
}

// --------------------------------------
// 6. Event Listeners
// --------------------------------------
textInput.addEventListener('input', runSimulation);
modulationSelect.addEventListener('change', runSimulation);
noiseSlider.addEventListener('input', runSimulation);
window.addEventListener('load', () => {
    initializeCharts();
    runSimulation();
});