const animationBox = document.getElementById("animation");
const tempSlider = document.getElementById("temperature");
const particleSlider = document.getElementById("particleCount");
const tempVal = document.getElementById("tempVal");
const particleVal = document.getElementById("particleVal");

let particles = [];
let displacements = [];

// Update slider display
tempSlider.oninput = () => tempVal.innerText = tempSlider.value;
particleSlider.oninput = () => particleVal.innerText = particleSlider.value;

// Particle class
class Electron {
  constructor() {
    this.x = Math.random() * animationBox.clientWidth;
    this.y = Math.random() * animationBox.clientHeight;
    this.dx = 0;
    this.dy = 0;
    this.element = document.createElement("div");
    this.element.className = "particle";
    animationBox.appendChild(this.element);
  }

  move(temp) {
    const scale = temp / 20;
    this.dx = (Math.random() - 0.5) * scale;
    this.dy = (Math.random() - 0.5) * scale;

    this.x = Math.max(0, Math.min(animationBox.clientWidth, this.x + this.dx));
    this.y = Math.max(0, Math.min(animationBox.clientHeight, this.y + this.dy));

    this.element.style.left = `${this.x}px`;
    this.element.style.top = `${this.y}px`;

    displacements.push(this.dx); // store horizontal displacement
    if (displacements.length > 200) displacements.shift();
  }
}

// Create initial particles
function initParticles(count) {
  animationBox.innerHTML = "";
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new Electron());
  }
}
initParticles(parseInt(particleSlider.value));

// Update histogram
const ctx = document.getElementById("histogramChart").getContext("2d");
const histogramChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: [],
    datasets: [{
      label: "Displacement",
      data: [],
      backgroundColor: "rgba(54, 162, 235, 0.6)",
      borderColor: "rgba(54, 162, 235, 1)",
      borderWidth: 1,
    }]
  },
  options: {
    scales: {
      x: { beginAtZero: true },
      y: { beginAtZero: true }
    }
  }
});

// Animate particles
function animate() {
  const temp = parseInt(tempSlider.value);
  const count = parseInt(particleSlider.value);
  if (count !== particles.length) initParticles(count);

  particles.forEach(p => p.move(temp));
  updateHistogram();
  requestAnimationFrame(animate);
}

// Update chart
function updateHistogram() {
  const bins = 20;
  const min = -10, max = 10;
  const binSize = (max - min) / bins;
  const counts = new Array(bins).fill(0);

  displacements.forEach(val => {
    const bin = Math.floor((val - min) / binSize);
    if (bin >= 0 && bin < bins) counts[bin]++;
  });

  const labels = counts.map((_, i) => (min + i * binSize).toFixed(1));
  histogramChart.data.labels = labels;
  histogramChart.data.datasets[0].data = counts;
  histogramChart.update();
}

animate();
