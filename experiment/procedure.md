### Procedure

---

#### **Experiment 1: Thermal Noise is Additive White Gaussian**

This experiment demonstrates how the collective random motion of electrons in a conductor, governed by thermal energy, generates a noise voltage that follows a **Gaussian (Normal) distribution**. This phenomenon is a direct and powerful consequence of the **Central Limit Theorem (CLT)**.

In a conductor at a fixed temperature (T), free electrons move chaotically due to thermal energy. While the motion of any single electron is unpredictable, the combined effect of a vast number of electrons gives rise to a fluctuating net current, which in turn creates a noise voltage across the conductor's resistance (R).

The key insight is that this instantaneous noise voltage is the sum of the contributions from N individual electrons:

V_noise ∝ Σ v_ix (i = 1 to N)


The **Central Limit Theorem** states that when N is large, the distribution of this sum will be approximately Gaussian, regardless of the exact distribution of a single electron's velocity.

Furthermore, the theoretical variance (σ²) of this thermal noise voltage is predicted by the **Johnson-Nyquist noise formula**:

σ² = 4 × kB × T × R × B

Where:
- `kB` is the Boltzmann constant (≈ 1.38 × 10⁻²³ J/K)
- `T` is temperature in Kelvin
- `R` is the resistance in ohms (Ω)
- `B` is the bandwidth in Hz

**Your tasks are to:**

1. **Start the simulation** with a set number of electrons (N) and observe their random motion within the conductor at a fixed room temperature of 300 K.

2. **Observe the Noise Voltage Histogram.** As the simulation runs, a histogram of the instantaneous noise voltage is plotted. Notice how the shape of the blue bars (the simulated data) begins to form the classic bell curve.

3. **Compare with the Theoretical Gaussian PDF.** The simulation overlays a theoretical Gaussian curve (in orange) calculated using the Johnson-Nyquist formula. Visually verify how well the simulated data fits this ideal curve.

4. **Investigate the effect of N.** Reset the simulation and increase the **Number of Electrons**. As N increases, the simulated histogram becomes a much smoother and more accurate fit to the theoretical Gaussian curve, providing a clear demonstration of the Central Limit Theorem in action.

---

#### **Experiment 2: Autocorrelation and Power Spectral Density of AWGN**

This experiment explores two defining statistical properties of **Additive White Gaussian Noise (AWGN)**: its **autocorrelation** and its **Power Spectral Density (PSD)**. "White" noise is a theoretical concept where the noise power is evenly distributed across all frequencies, and the signal at any point in time is completely uncorrelated with the signal at any other point.

- **Autocorrelation Function R(τ):** This function measures the correlation of a signal with a time-shifted version of itself (where τ is the time lag). For ideal white noise, the signal is only perfectly correlated with itself at τ = 0 and completely uncorrelated for any τ ≠ 0. This results in an **impulse function** (a sharp spike at zero).

- **Power Spectral Density (PSD):** The PSD is the Fourier Transform of the autocorrelation function. Since the autocorrelation is an impulse, its Fourier Transform is a constant value. This means the PSD of ideal white noise is **flat across all frequencies**, indicating that noise power is distributed equally.

**Your tasks are to:**

1. **Generate an AWGN signal.** Use the slider to set the **Noise Power (σ²)** and generate a new signal.

2. **Analyze the Autocorrelation Plot.** Observe the plot of the sample autocorrelation. You should see a large spike at a time lag of 0 and values very close to zero for all other time lags, approximating an impulse function.

3. **Analyze the Power Spectral Density (PSD) Plot.** Observe the PSD plot. You should see that the power is distributed approximately evenly across the frequency spectrum, resulting in a nearly flat line — the signature of "white" noise.

4. **Calculate Power in a Frequency Band.** Use the two frequency sliders to select a specific band of interest on the PSD plot. The Observations panel will calculate the total noise power contained within just that band. Verify that the power scales linearly with the selected bandwidth, which is a key property of a flat PSD.
