document.addEventListener('DOMContentLoaded', () => {

    const charts = {}; // To hold chart instances
    const initialBlue = '#3273dc';

    // --- UTILITY FUNCTIONS ---
    
    // Shuffles an array in place
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };
    
    // Adds small random noise to a data point
    const addNoise = (value, amount = 0.08) => value + (Math.random() - 0.5) * amount;

    // --- CHARTING LOGIC ---
    const createChart = (ctx, type, labels, datasets, xAxisLabel, yAxisLabel) => {
        return new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: { display: true, text: xAxisLabel, font: { weight: 'bold' } },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: yAxisLabel, font: { weight: 'bold' } },
                        grid: { display: false },
                        min: 0,
                        max: 1.2 // Set a fixed y-axis to make the flat line clear
                    }
                },
                plugins: { legend: { display: false } },
                animation: { duration: 0 } // No animation for instant rendering
            }
        });
    };

    // --- PLOT DEFINITIONS ---
    const plotLabels = Array.from({ length: 21 }, (_, i) => (i - 10).toString());

    const acfPlotConfigs = [
        {
            type: 'impulse',
            chartType: 'bar',
            data: plotLabels.map(x => (Number(x) === 0 ? 1 : 0)), // Ideal impulse
            datasetOptions: { backgroundColor: initialBlue, barPercentage: 0.2 },
            yAxisLabel: 'Correlation'
        },
        {
            type: 'exponential',
            chartType: 'line',
            data: plotLabels.map(x => addNoise(Math.exp(-Math.abs(Number(x)) * 0.8))),
            datasetOptions: { borderColor: initialBlue, borderWidth: 2.5, pointRadius: 0, tension: 0.1 },
            yAxisLabel: 'Correlation'
        },
        {
            type: 'sinc',
            chartType: 'line',
            data: plotLabels.map(x => addNoise(Number(x) === 0 ? 1 : Math.sin(Math.PI * Number(x) * 0.8) / (Math.PI * Number(x) * 0.8))),
            datasetOptions: { borderColor: initialBlue, borderWidth: 2.5, pointRadius: 0, tension: 0.1 },
            yAxisLabel: 'Correlation'
        }
    ];

    const psdPlotConfigs = [
        {
            type: 'constant',
            chartType: 'line',
            data: Array(plotLabels.length).fill(0.8), // IDEAL flat line, no noise
            // FIXED: Added pointRadius: 0 to remove the dots on the line
            datasetOptions: { borderColor: initialBlue, borderWidth: 3, pointRadius: 0 },
            yAxisLabel: 'Power'
        },
        {
            type: 'lorentzian',
            chartType: 'line',
            data: plotLabels.map(x => addNoise(0.8 / (1 + (Number(x) * 0.3) ** 2))),
            datasetOptions: { borderColor: initialBlue, borderWidth: 2.5, pointRadius: 0, tension: 0.2 },
            yAxisLabel: 'Power'
        },
        {
            type: 'triangular',
            chartType: 'line',
            data: plotLabels.map(x => addNoise(Math.max(0, 0.8 - Math.abs(Number(x) * 0.08)))),
            datasetOptions: { borderColor: initialBlue, borderWidth: 2.5, pointRadius: 0 },
            yAxisLabel: 'Power'
        }
    ];

    // --- RENDERING & INTERACTION LOGIC ---

    const renderPlots = (prefix, configs) => {
        shuffleArray(configs);
        configs.forEach((config, i) => {
            const index = i + 1;
            const plotOptionEl = document.getElementById(`${prefix}-option-${index}`);
            const canvas = document.getElementById(`${prefix}Chart${index}`);
            const radio = document.getElementById(`${prefix}_radio${index}`);
            
            plotOptionEl.dataset.value = config.type;
            radio.value = config.type;

            const dataset = { data: config.data, ...config.datasetOptions };
            const xAxisLabel = prefix === 'acf' ? 'Time Lag (τ)' : 'Frequency (f)';
            
            if (charts[`${prefix}Chart${index}`]) charts[`${prefix}Chart${index}`].destroy();
            charts[`${prefix}Chart${index}`] = createChart(canvas.getContext('2d'), config.chartType, plotLabels, [dataset], xAxisLabel, config.yAxisLabel);
        });
    };

    const handleSelection = (containerId, selectedElement) => {
        const container = document.getElementById(containerId);
        container.querySelectorAll('.plot-option').forEach(el => el.classList.remove('selected'));
        selectedElement.classList.add('selected');
        selectedElement.querySelector('input[type="radio"]').checked = true;
    };

    const resetPlotStyles = (containerId) => {
        document.querySelectorAll(`#${containerId} .plot-option`).forEach(el => {
            el.classList.remove('correct-selection', 'incorrect-selection');
        });
    };

    const checkAnswer = (groupPrefix, correctType, observationsId) => {
        const observationsDiv = document.getElementById(observationsId);
        resetPlotStyles(`${groupPrefix}-selection`);
        
        const selected = document.querySelector(`input[name="${groupPrefix}_choice"]:checked`);
        if (!selected) {
            observationsDiv.innerHTML = `<p>Please select a ${groupPrefix.toUpperCase()} plot first.</p>`;
            return;
        }

        const value = selected.value;
        const selectedOptionEl = selected.closest('.plot-option');
        const correctOptionEl = document.querySelector(`#${groupPrefix}-selection .plot-option[data-value="${correctType}"]`);
        let html = '';

        if (value === correctType) {
            selectedOptionEl.classList.add('correct-selection');
            if (groupPrefix === 'acf') {
                 html = `<div class="obs-title correct">Correct!</div><p>The ideal Autocorrelation Function (ACF) of white noise is a <strong>perfect impulse</strong>.</p><ul><li>This shows that the noise is only correlated with itself at a time lag of zero (τ=0).</li><li>The correlation is exactly zero everywhere else.</li></ul>`;
            } else { // PSD
                 html = `<div class="obs-title correct">Correct!</div><p>The ideal Power Spectral Density (PSD) of white noise is a <strong>perfectly flat, constant line</strong>.</p><ul><li>This represents the theoretical model where noise power is distributed exactly equally across all frequencies.</li><li>This is the definition of "white" in the frequency domain.</li></ul>`;
            }
        } else {
            selectedOptionEl.classList.add('incorrect-selection');
            correctOptionEl.classList.add('correct-selection');
            html = `<div class="obs-title incorrect">Incorrect.</div>`;
            if (groupPrefix === 'acf') {
                if (value === 'exponential') html += `<p>You chose the <strong>exponential decay</strong>. This ACF is characteristic of colored noise (like a Markov process), where correlation decays over time.</p>`;
                else if (value === 'sinc') html += `<p>You chose the <strong>sinc function</strong>. This ACF corresponds to band-limited white noise, not ideal white noise which has infinite bandwidth.</p>`;
            } else { // PSD
                if (value === 'lorentzian') html += `<p>You chose the <strong>Lorentzian</strong> plot. This describes colored noise where power is concentrated at lower frequencies.</p>`;
                else if (value === 'triangular') html += `<p>You chose the <strong>triangular</strong> plot. This is a form of filtered noise, not ideal white noise with uniform power.</p>`;
            }
        }
        observationsDiv.innerHTML = html;
    };
    
    // --- INITIALIZATION ---

    // Initial render
    renderPlots('acf', acfPlotConfigs);
    renderPlots('psd', psdPlotConfigs);

    // Attach event listeners
    document.querySelectorAll('.plot-selection-container .plot-option').forEach(el => {
        el.addEventListener('click', (e) => handleSelection(e.currentTarget.parentElement.id, e.currentTarget));
    });
    
    document.getElementById('checkAcfBtn').addEventListener('click', () => checkAnswer('acf', 'impulse', 'acf-observations'));
    document.getElementById('checkPsdBtn').addEventListener('click', () => checkAnswer('psd', 'constant', 'psd-observations'));
});