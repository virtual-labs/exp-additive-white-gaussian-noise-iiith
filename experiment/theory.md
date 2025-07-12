## Experiment 1: Thermal Noise and the Central Limit Theorem

#### 1.1 Overview and Physical Origin

In any electrical conductor at a temperature above absolute zero (T > 0 K), the constituent electrons are in continuous, random motion due to their thermal energy. While the net movement of charge over time is zero in the absence of an external voltage source, at any given instant, the random velocities of billions of electrons result in a small, fluctuating net current. When this current flows through the conductor's intrinsic resistance (R), it produces a noise voltage, V(t). This phenomenon is known as Johnson-Nyquist noise or thermal noise.

The key insight is that the macroscopic noise voltage measured at any instant is the superposition (sum) of the microscopic effects of a vast number (N) of individual electrons moving independently.

### 1.2 The Central Limit Theorem (CLT)

The Central Limit Theorem is a cornerstone of probability theory. It states that the sum of a large number of independent and identically distributed (i.i.d.) random variables will be approximately normally (Gaussian) distributed, regardless of the underlying distribution of the individual variables.

In our case, the noise voltage can be expressed as a sum:

```
V_noise(t) ∝ Σ v_ix(t)   (i = 1 to N)
```

where v\_ix(t) is the horizontal velocity of the i-th electron at time t. Since N is extremely large (on the order of 10^23) and the motions are largely independent, the CLT predicts that the distribution of V\_noise(t) will be Gaussian.

### 1.3 The Gaussian Distribution and Johnson-Nyquist Noise

Since the electron motion is random with no preferred direction, the mean of the noise voltage is zero:

```
E[V_noise(t)] = 0
```

The power of the noise, which corresponds to its variance (σ^2), is not zero. It is given by the Johnson-Nyquist formula:

```
σ^2 = 4 kB T R B
```

Where:

* kB is the Boltzmann constant (1.38 × 10^-23 J/K)
* T is the absolute temperature in Kelvin (K)
* R is the resistance in Ohms (Ω)
* B is the measurement bandwidth in Hertz (Hz)

Therefore, thermal noise voltage V is a Gaussian random variable,

```
V ∼ N(0, σ^2)
```

with a Probability Density Function (PDF) given by:

```
f_V(v) = (1 / sqrt(2πσ^2)) * exp(-v^2 / (2σ^2))
```

The simulation plots a histogram of the measured noise voltage and overlays this theoretical PDF, demonstrating the accuracy of the model.

---

## Experiment 2: Autocorrelation and Power Spectral Density of AWGN

### 2.1 Autocorrelation of White Noise

The autocorrelation function, R\_X(τ), of a random process X(t) describes the correlation between the signal's values at two different points in time, separated by a lag τ. It is formally defined as:

```
R_X(τ) = E[X(t) X(t + τ)]
```

The term "white" in AWGN is an analogy to white light, which contains all frequencies in equal proportion. For a signal, "white" means that the signal's value at any time t is completely uncorrelated with its value at any other time t + τ (for τ ≠ 0).

Therefore, for an ideal white noise process with a mean of zero:

* If τ ≠ 0, the values are uncorrelated, so:

  ```
  R_X(τ) = E[X(t)] E[X(t + τ)] = 0 * 0 = 0
  ```
* If τ = 0, the correlation is with the signal itself:

  ```
  R_X(0) = E[X(t) X(t)] = E[X(t)^2] = σ^2
  ```

which is the average power or variance of the process.

Combining these results, the autocorrelation function for white noise is a scaled Dirac delta function:

```
R_X(τ) = σ^2 δ(τ)
```

This means the function is an infinitely sharp spike at τ = 0 and zero everywhere else. The simulation will show a sharp peak at τ = 0, approximating this behavior.

### 2.2 Power Spectral Density (PSD)

The Power Spectral Density (PSD), S\_X(f), describes how the power of a signal is distributed over the frequency domain. It is fundamentally linked to the autocorrelation function by the Wiener-Khinchin Theorem, which states that the PSD is the Fourier Transform of the autocorrelation function:

```
S_X(f) = F{R_X(τ)} = ∫ from -∞ to ∞ [R_X(τ) * exp(-j 2π f τ) dτ]
```

Using the result from the previous section, we take the Fourier Transform of the autocorrelation impulse:

```
S_X(f) = F{σ^2 δ(τ)} = σ^2 ∫ from -∞ to ∞ [δ(τ) * exp(-j 2π f τ) dτ]
```

By the sifting property of the Dirac delta function, this integral evaluates to 1 at τ = 0, leaving:

```
S_X(f) = σ^2
```

This is a profound result: the PSD of white noise is a constant for all frequencies. This means the noise power is uniformly spread across the entire frequency spectrum, which is the mathematical definition of "white". In communications, this constant is often denoted as N0 / 2.

### 2.3 Noise Power in a Bandwidth

The total power of a signal can be found by integrating its PSD over all frequencies. To find the power within a specific frequency band from f1 to f2, we integrate over that range:

```
P_band = ∫ from f1 to f2 [S_X(f) df]
```

Since S\_X(f) = σ^2 is a constant for AWGN, the integral simplifies to:

```
P_band = σ^2 (f2 - f1)
```

The simulation demonstrates this by allowing you to select a frequency band and showing that the calculated power is directly proportional to the bandwidth you select.
