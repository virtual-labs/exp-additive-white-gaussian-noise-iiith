document.addEventListener('DOMContentLoaded', () => {
    const filterSlider = document.getElementById('filterSlider');
    const statusBox = document.getElementById('status-box');
    const rhoDisplay = document.getElementById('rhoDisplay');
    const scatterCtx = document.getElementById('scatterPlot').getContext('2d');
    const timeCtx = document.getElementById('timeSeriesChart').getContext('2d');

    let scatterChart, timeChart;
    let animationFrameId;

    const NUM_SCATTER_POINTS = 200;
    const NUM_TIME_POINTS = 256;
    const TIME_DELAY = 5; // The 'τ' for X(t-τ)

    // --- Data Buffers ---
    let noiseBuffer = [];
    let scatterPoints = [];

    // --- Chart Initialization ---
    const initializeCharts = () => {
        scatterChart = new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    { type: 'line', data: [], fill: true, borderColor: 'rgba(54, 162, 235, 0.5)', backgroundColor: 'rgba(54, 162, 235, 0.1)', borderWidth: 2, pointRadius: 0, tension: 0.1, order: 1 },
                    { type: 'line', data: [], fill: false, borderColor: 'rgba(54, 162, 235, 0.5)', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.1, order: 2 },
                    { type: 'scatter', data: [], backgroundColor: 'rgba(54, 162, 235, 0.7)', order: 3 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: '2D Joint Distribution: X(t) vs X(t-τ)' } },
                scales: {
                    x: { min: -3, max: 3, title: { display: true, text: 'X(t)' } },
                    y: { min: -3, max: 3, title: { display: true, text: `X(t-${TIME_DELAY})` } }
                }
            }
        });

        timeChart = new Chart(timeCtx, {
            type: 'line',
            data: { labels: Array(NUM_TIME_POINTS).fill(0), datasets: [{ data: [], borderColor: '#36a2eb', borderWidth: 1.5, pointRadius: 0, tension: 0.2 }] },
            options: {
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { min: -3, max: 3 } }
            }
        });
    };

    // --- Core Logic ---
    const generateNoisePoint = () => {
        const u1 = Math.random(); const u2 = Math.random();
        return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    };

    const getEllipsePoints = (covariance, variance) => {
        const angle = covariance === 0 ? 0 : Math.atan2(2 * covariance, variance.x - variance.y) / 2;
        const cos = Math.cos(angle); const sin = Math.sin(angle);
        const term1 = (variance.x + variance.y) / 2;
        const term2 = Math.sqrt(Math.pow(variance.x - variance.y, 2) / 4 + Math.pow(covariance, 2));
        const lambda1 = term1 + term2; const lambda2 = term1 - term2;
        const a = Math.sqrt(lambda1); const b = Math.sqrt(lambda2);
        const points = [];
        for (let i = 0; i <= 360; i += 10) {
            const rad = i * (Math.PI / 180);
            const x0 = a * Math.cos(rad); const y0 = b * Math.sin(rad);
            points.push({ x: x0 * cos - y0 * sin, y: x0 * sin + y0 * cos });
        }
        return points;
    };

    // --- Animation Loop ---
    const animate = () => {
        const filterAlpha = parseInt(filterSlider.value, 10) / 100;

        const whiteNoise = generateNoisePoint();
        const lastFiltered = noiseBuffer.length > 0 ? noiseBuffer[noiseBuffer.length - 1] : 0;
        const filteredNoise = (1 - filterAlpha) * whiteNoise + filterAlpha * lastFiltered;
        noiseBuffer.push(filteredNoise);
        if (noiseBuffer.length > NUM_TIME_POINTS) noiseBuffer.shift();

        if (noiseBuffer.length > TIME_DELAY) {
            scatterPoints.push({ x: noiseBuffer[noiseBuffer.length - 1], y: noiseBuffer[noiseBuffer.length - 1 - TIME_DELAY] });
        }
        if (scatterPoints.length > NUM_SCATTER_POINTS) scatterPoints.shift();
        
        const varX = (1 - filterAlpha) / (1 + filterAlpha);
        const covariance = varX * Math.pow(filterAlpha, TIME_DELAY);
        const rho = (covariance / varX); // For AR(1) process, rho(τ) = α^τ

        const contour1 = getEllipsePoints(covariance, { x: varX, y: varX }).map(p => ({ x: p.x * 1, y: p.y * 1 }));
        const contour2 = getEllipsePoints(covariance, { x: varX, y: varX }).map(p => ({ x: p.x * 2, y: p.y * 2 }));
        
        // --- Update UI ---
        if (filterAlpha < 0.1) {
            statusBox.className = 'status-box uncorrelated';
            statusBox.firstElementChild.textContent = 'UNCORRELATED (Independent)';
        } else {
            statusBox.className = 'status-box correlated';
            statusBox.firstElementChild.textContent = 'CORRELATED (Dependent)';
        }
        rhoDisplay.textContent = `Theoretical ρ = ${rho.toFixed(4)}`;
        
        // --- Update Charts ---
        scatterChart.data.datasets[0].data = contour2;
        scatterChart.data.datasets[1].data = contour1;
        scatterChart.data.datasets[2].data = scatterPoints;
        timeChart.data.datasets[0].data = noiseBuffer;

        scatterChart.update('none');
        timeChart.update('none');
        
        animationFrameId = requestAnimationFrame(animate);
    };

    initializeCharts();
    animate();
});