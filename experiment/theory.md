### The Theory of Additive White Gaussian Noise (AWGN)

Additive White Gaussian Noise (AWGN) is a fundamental model used in information theory, signal processing, and communications engineering to represent the influence of random, unavoidable noise on a signal. Each component of its name—Additive, White, and Gaussian—describes a core mathematical property of the noise.

#### 1. Additive: The Noise Combines by Addition

The term "additive" implies that the noise, $N(t)$, is simply added to the original signal, $S(t)$, to produce the received signal, $Y(t)$.

$$
Y(t) = S(t) + N(t)
$$

This linear combination is the simplest way a signal can be corrupted. The model assumes that the noise is independent of the signal and is not influenced by it in any multiplicative or more complex way.

#### 2. Gaussian: The Amplitude Follows a Normal Distribution

The "Gaussian" property describes the statistical distribution of the noise's amplitude in the time domain. At any given moment, the value of the noise voltage or current follows a Gaussian (or Normal) probability distribution.

The Probability Density Function (PDF) for a Gaussian random variable with a mean ($\mu$) of zero and a variance of $\sigma^2$ is given by:

$$
f_N(n) = \frac{1}{\sqrt{2\pi\sigma^2}} \exp\left(-\frac{n^2}{2\sigma^2}\right)
$$

In this context:

* **Mean ($\mu = 0$)**: Since the noise is random, its amplitude is equally likely to be positive or negative, resulting in an average value of zero over time.
* **Variance ($\sigma^2$)**: This represents the average power of the noise. A higher variance means greater noise power and a wider, flatter bell curve.

#### 3. White: Uniform Power in the Frequency Domain

The term "white" is an analogy to white light, which contains all frequencies of the visible spectrum in equal proportion. For a signal, "white" noise means its power is uniformly distributed across the entire frequency spectrum. This crucial property is described by the **Power Spectral Density (PSD)**.

### Autocorrelation of AWGN

For white noise, the signal is completely uncorrelated with its value at any other instant.

* For any time lag $\tau \neq 0$, the correlation is zero.
* For a time lag of $\tau = 0$, the correlation is perfect, and the value is the average power of the noise, $\sigma^2$.

This is mathematically modeled using the **Dirac delta function**, $\delta(\tau)$, which is an infinitely sharp spike at zero and zero everywhere else.

$$
R_N(\tau) = E[N(t)N(t+\tau)] = \frac{N_0}{2} \delta(\tau)
$$

The **Wiener-Khinchin Theorem** establishes the link between the two domains: it states that the PSD is the Fourier Transform of the autocorrelation function. Taking the Fourier Transform of the delta function in the time domain results in a constant value in the frequency domain, perfectly describing the flat PSD of white noise.

### Power Spectral Density (PSD) of White Noise

The Power Spectral Density (PSD), denoted $S_N(f)$, describes how the power of a signal is distributed as a function of frequency. For ideal white noise, the PSD is a constant for all frequencies, from negative infinity to positive infinity.

The PSD is formally given by:

$$
S_N(f) = \frac{N_0}{2} \quad (\text{for all } f)
$$

Here, $N_0$ is a fundamental constant representing the **power spectral density in Watts per Hertz (W/Hz)**. The factor of 2 in the denominator accounts for the two-sided nature of the frequency spectrum (both positive and negative frequencies).

**Significance of a Constant PSD:**

* **Uniform Power Distribution**: A flat PSD means that the noise contributes an equal amount of power at every frequency. This is why filtering is effective: by restricting the frequency range (the bandwidth), we can reduce the total amount of noise power affecting the signal.
* **Infinite Power (Theoretical)**: An ideal white noise signal with a perfectly flat PSD over an infinite bandwidth would have infinite total power. In reality, all physical systems have a finite bandwidth, so the noise power is always finite.

**Calculating Noise Power in a Bandwidth:**
The total noise power, $P_N$, within a specific frequency bandwidth, $B$, can be calculated by integrating the PSD over that bandwidth. For a system with a bandwidth $B$, the noise power is:

$$
P_N = \int_{-B/2}^{B/2} S_N(f) \, df = \int_{-B/2}^{B/2} \frac{N_0}{2} \, df = \frac{N_0}{2} \times B
$$

For a passband system (using only positive frequencies), the power is often expressed as:

$$
P_N = N_0 \times B
$$

This simple, linear relationship shows that the total noise power in a system is directly proportional to its bandwidth.

### Where is AWGN Found?

AWGN is not just a theoretical convenience; it is an accurate model for many real-world sources of random noise, including:

* **Thermal Noise (Johnson-Nyquist Noise)**: Arises from the thermal agitation of charge carriers (usually electrons) inside an electrical conductor at temperatures above absolute zero. This is a primary source of noise in electronic components like resistors, amplifiers, and sensors.
* **Shot Noise**: Occurs due to the discrete nature of electric charge in electronic devices like diodes and transistors. The random arrival of electrons or holes at a junction creates a fluctuating current.
* **Atmospheric and Deep Space Noise**: Electromagnetic waves radiated by the Earth's atmosphere, the sun, and other celestial objects (like black-body radiation) are often modeled as AWGN, especially in satellite and deep-space communication links.
