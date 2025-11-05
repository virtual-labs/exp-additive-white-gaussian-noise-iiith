document.addEventListener('DOMContentLoaded', () => {
    const filterSlider = document.getElementById('filterSlider');
    const statusBox = document.getElementById('status-box');
    const rhoDisplay = document.getElementById('rhoDisplay');
    // Covariance Matrix UI Elements
    const cov11 = document.getElementById('cov_11');
    const cov12 = document.getElementById('cov_12');
    const cov21 = document.getElementById('cov_21');
    const cov22 = document.getElementById('cov_22');
    
    const scatterCtx = document.getElementById('scatterPlot').getContext('2d');
    const timeCtx = document.getElementById('timeSeriesChart').getContext('2d');

    let scatterChart, timeChart;
    let animationFrameId;

    const NUM_SCATTER_POINTS = 200;
    const NUM_TIME_POINTS = 256;

    // --- Data Buffers ---
    let timeSeriesBuffer = [];
    let scatterPoints = [];

    // --- Chart Initialization ---
    const initializeCharts = () => {
        scatterChart = new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [
                    { type: 'line', data: [], fill: true, borderColor: 'rgba(54, 162, 235, 0.5)', backgroundColor: 'rgba(54, 162, 235, 0.1)', borderWidth: 2, pointRadius: 0, tension: 0.1, order: 2 },
                    { type: 'line', data: [], fill: false, borderColor: 'rgba(54, 162, 235, 0.5)', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.1, order: 3 },
                    { type: 'scatter', data: [], backgroundColor: 'rgba(54, 162, 235, 0.7)', order: 1 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true, 
                aspectRatio: 1, // Force a 1:1 aspect ratio (square plot)
                plugins: { 
                    legend: { display: false }, 
                    title: { display: true, text: '2D Joint Distribution: X₁ vs X₂' } 
                },
                scales: {
                    x: { min: -3.5, max: 3.5, title: { display: true, text: 'X₁' } },
                    y: { min: -3.5, max: 3.5, title: { display: true, text: 'X₂' } }
                }
            }
        });

        timeChart = new Chart(timeCtx, {
            type: 'line',
            data: { labels: Array(NUM_TIME_POINTS).fill(0), datasets: [{ data: [], borderColor: '#36a2eb', borderWidth: 1.5, pointRadius: 0, tension: 0.2 }] },
            options: {
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { min: -3.5, max: 3.5 } }
            }
        });
    };

    // --- Core Logic ---
    const generateNoisePoint = () => { // Standard Normal distribution (Box-Muller transform)
        const u1 = Math.random(); const u2 = Math.random();
        return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    };

    const getEllipsePoints = (covariance, variance) => { // Generates points for the covariance ellipse
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
        const rho = parseInt(filterSlider.value, 10) / 100;

        // --- 1. Generate new point for the SCATTER PLOT ---
        // Generates an independent (x1, x2) pair according to the covariance matrix
        const z1 = generateNoisePoint();
        const z2 = generateNoisePoint();
        const x1 = z1;
        const x2 = rho * z1 + Math.sqrt(1 - rho**2) * z2;
        
        scatterPoints.push({ x: x1, y: x2 });
        if (scatterPoints.length > NUM_SCATTER_POINTS) scatterPoints.shift();
        
        // --- 2. Generate new point for the TIME SERIES PLOT (FIXED) ---
        // This AR(1) process creates a signal that is visually dynamic and smooth
        const whiteNoise = generateNoisePoint();
        const lastValue = timeSeriesBuffer.length > 0 ? timeSeriesBuffer[timeSeriesBuffer.length - 1] : 0;
        // Generate the new point using the previous value, ensuring the process has unit variance
        const newValue = rho * lastValue + Math.sqrt(1 - rho**2) * whiteNoise;

        timeSeriesBuffer.push(newValue);
        if (timeSeriesBuffer.length > NUM_TIME_POINTS) timeSeriesBuffer.shift();
        
        // --- 3. Define variance/covariance for drawing ellipses ---
        const variance = { x: 1, y: 1 };
        const covariance = rho;
        const contour1 = getEllipsePoints(covariance, variance).map(p => ({ x: p.x * 1, y: p.y * 1 }));
        const contour2 = getEllipsePoints(covariance, variance).map(p => ({ x: p.x * 2, y: p.y * 2 }));
        
        // --- 4. Update UI ---
        if (Math.abs(rho) < 0.1) {
            statusBox.className = 'status-box uncorrelated';
            statusBox.firstElementChild.textContent = 'UNCORRELATED (Independent)';
        } else {
            statusBox.className = 'status-box correlated';
            statusBox.firstElementChild.textContent = 'CORRELATED (Dependent)';
        }
        rhoDisplay.textContent = `Correlation ρ = ${rho.toFixed(3)}`;

        // Update Covariance Matrix display
        cov11.textContent = (1.0).toFixed(2);
        cov22.textContent = (1.0).toFixed(2);
        cov12.textContent = rho.toFixed(2);
        cov21.textContent = rho.toFixed(2);
        
        // --- 5. Update Charts ---
        scatterChart.data.datasets[0].data = contour2;
        scatterChart.data.datasets[1].data = contour1;
        scatterChart.data.datasets[2].data = scatterPoints;
        timeChart.data.datasets[0].data = timeSeriesBuffer;

        scatterChart.update('none');
        timeChart.update('none');
        
        animationFrameId = requestAnimationFrame(animate);
    };

    initializeCharts();
    animate();
});