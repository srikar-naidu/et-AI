/**
 * Low-level image-processing utilities for counterfeit currency analysis.
 *
 * Every function operates on our PixelData type (RGBA Uint8ClampedArray)
 * and uses only the browser Canvas API — zero native dependencies.
 */

import type { PixelData, RegionOfInterest, HistogramResult } from "./types";

/* ─── Constants ──────────────────────────────────────────────────────── */

/** Maximum width the analysis pipeline will process (larger images are down-scaled). */
const ANALYSIS_MAX_WIDTH = 800;

/* ─── Resize ─────────────────────────────────────────────────────────── */

/** Down-scale to ANALYSIS_MAX_WIDTH if necessary. */
export function resizeForAnalysis(src: PixelData): PixelData {
  if (src.width <= ANALYSIS_MAX_WIDTH) return src;
  const scale = ANALYSIS_MAX_WIDTH / src.width;
  return resizePixelData(src, Math.round(src.width * scale), Math.round(src.height * scale));
}

/** Bilinear-interpolation resize. */
export function resizePixelData(
  src: PixelData,
  targetWidth: number,
  targetHeight: number,
): PixelData {
  const out = new Uint8ClampedArray(targetWidth * targetHeight * 4);
  const xRatio = src.width / targetWidth;
  const yRatio = src.height / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcX = x * xRatio;
      const srcY = y * yRatio;
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, src.width - 1);
      const y1 = Math.min(y0 + 1, src.height - 1);
      const dx = srcX - x0;
      const dy = srcY - y0;

      const outIdx = (y * targetWidth + x) * 4;
      for (let c = 0; c < 4; c++) {
        const tl = src.data[(y0 * src.width + x0) * 4 + c];
        const tr = src.data[(y0 * src.width + x1) * 4 + c];
        const bl = src.data[(y1 * src.width + x0) * 4 + c];
        const br = src.data[(y1 * src.width + x1) * 4 + c];
        out[outIdx + c] = Math.round(
          tl * (1 - dx) * (1 - dy) +
          tr * dx * (1 - dy) +
          bl * (1 - dx) * dy +
          br * dx * dy,
        );
      }
    }
  }
  return { data: out, width: targetWidth, height: targetHeight };
}

/* ─── Colour Conversion ──────────────────────────────────────────────── */

/** Convert RGBA image to grayscale (BT.601 luminance). */
export function toGrayscale(src: PixelData): PixelData {
  const { data, width, height } = src;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    out[i] = out[i + 1] = out[i + 2] = lum;
    out[i + 3] = 255;
  }
  return { data: out, width, height };
}

/** RGB → HSL.  H in [0, 360), S and L in [0, 1]. */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;

  return [h * 360, s, l];
}

/** Separate an RGBA image into per-channel Float32Arrays. */
export function separateChannels(src: PixelData): {
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
} {
  const total = src.width * src.height;
  const r = new Float32Array(total);
  const g = new Float32Array(total);
  const b = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    r[i] = src.data[i * 4];
    g[i] = src.data[i * 4 + 1];
    b[i] = src.data[i * 4 + 2];
  }
  return { r, g, b };
}

/* ─── Edge Detection ─────────────────────────────────────────────────── */

/** 3×3 Sobel edge-detection on a grayscale image. */
export function sobelEdgeDetection(gray: PixelData): PixelData {
  const { data, width, height } = gray;
  const out = new Uint8ClampedArray(width * height * 4);
  out.fill(0);

  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumX = 0;
      let sumY = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const val = data[((y + ky) * width + (x + kx)) * 4];
          const ki = (ky + 1) * 3 + (kx + 1);
          sumX += val * gx[ki];
          sumY += val * gy[ki];
        }
      }
      const mag = Math.min(255, Math.round(Math.sqrt(sumX * sumX + sumY * sumY)));
      const idx = (y * width + x) * 4;
      out[idx] = out[idx + 1] = out[idx + 2] = mag;
      out[idx + 3] = 255;
    }
  }
  return { data: out, width, height };
}

/** Fraction of pixels whose edge magnitude exceeds `threshold`. */
export function computeEdgeDensity(edgeImage: PixelData, threshold: number): number {
  let count = 0;
  const total = edgeImage.width * edgeImage.height;
  for (let i = 0; i < edgeImage.data.length; i += 4) {
    if (edgeImage.data[i] > threshold) count++;
  }
  return count / total;
}

/* ─── Thresholding ───────────────────────────────────────────────────── */

/**
 * Adaptive (local-mean) thresholding.
 * Output: 255 if pixel > (local mean − C), else 0.
 *
 * Uses an integral image for O(1) per-pixel neighbourhood mean.
 */
export function adaptiveThreshold(
  gray: PixelData,
  blockSize: number,
  C: number,
): PixelData {
  const { data, width, height } = gray;
  const out = new Uint8ClampedArray(width * height * 4);
  const half = Math.floor(blockSize / 2);

  // Build integral image
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += data[(y * width + x) * 4];
      integral[(y + 1) * (width + 1) + (x + 1)] =
        integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const y0 = Math.max(0, y - half);
      const y1 = Math.min(height - 1, y + half);
      const x0 = Math.max(0, x - half);
      const x1 = Math.min(width - 1, x + half);
      const count = (y1 - y0 + 1) * (x1 - x0 + 1);

      const sum =
        integral[(y1 + 1) * (width + 1) + (x1 + 1)] -
        integral[y0 * (width + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (width + 1) + x0] +
        integral[y0 * (width + 1) + x0];

      const val = data[(y * width + x) * 4] > sum / count - C ? 255 : 0;
      const idx = (y * width + x) * 4;
      out[idx] = out[idx + 1] = out[idx + 2] = val;
      out[idx + 3] = 255;
    }
  }
  return { data: out, width, height };
}

/* ─── Local Variance ─────────────────────────────────────────────────── */

/**
 * Per-pixel local variance in a sliding window of `windowSize × windowSize`.
 * Returns one float per pixel.
 */
export function computeLocalVariance(
  gray: PixelData,
  windowSize: number,
): Float32Array {
  const { data, width, height } = gray;
  const variances = new Float32Array(width * height);
  const half = Math.floor(windowSize / 2);

  // Integral images for sum and sum-of-squares
  const w1 = width + 1;
  const intSum = new Float64Array(w1 * (height + 1));
  const intSqSum = new Float64Array(w1 * (height + 1));

  for (let y = 0; y < height; y++) {
    let rowS = 0;
    let rowSq = 0;
    for (let x = 0; x < width; x++) {
      const v = data[(y * width + x) * 4];
      rowS += v;
      rowSq += v * v;
      intSum[(y + 1) * w1 + (x + 1)] = intSum[y * w1 + (x + 1)] + rowS;
      intSqSum[(y + 1) * w1 + (x + 1)] = intSqSum[y * w1 + (x + 1)] + rowSq;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const y0 = Math.max(0, y - half);
      const y1 = Math.min(height - 1, y + half);
      const x0 = Math.max(0, x - half);
      const x1 = Math.min(width - 1, x + half);
      const n = (y1 - y0 + 1) * (x1 - x0 + 1);

      const s =
        intSum[(y1 + 1) * w1 + (x1 + 1)] -
        intSum[y0 * w1 + (x1 + 1)] -
        intSum[(y1 + 1) * w1 + x0] +
        intSum[y0 * w1 + x0];
      const sq =
        intSqSum[(y1 + 1) * w1 + (x1 + 1)] -
        intSqSum[y0 * w1 + (x1 + 1)] -
        intSqSum[(y1 + 1) * w1 + x0] +
        intSqSum[y0 * w1 + x0];

      const mean = s / n;
      variances[y * width + x] = sq / n - mean * mean;
    }
  }
  return variances;
}

/* ─── Region Extraction ──────────────────────────────────────────────── */

/** Crop a normalised ROI out of an image. */
export function extractRegion(src: PixelData, roi: RegionOfInterest): PixelData {
  const sx = Math.round(roi.x * src.width);
  const sy = Math.round(roi.y * src.height);
  const sw = Math.max(1, Math.round(roi.width * src.width));
  const sh = Math.max(1, Math.round(roi.height * src.height));

  const out = new Uint8ClampedArray(sw * sh * 4);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const srcX = Math.min(sx + x, src.width - 1);
      const srcY = Math.min(sy + y, src.height - 1);
      const si = (srcY * src.width + srcX) * 4;
      const di = (y * sw + x) * 4;
      out[di] = src.data[si];
      out[di + 1] = src.data[si + 1];
      out[di + 2] = src.data[si + 2];
      out[di + 3] = src.data[si + 3];
    }
  }
  return { data: out, width: sw, height: sh };
}

/** Extract a single horizontal scanline from a grayscale image. */
export function extractScanline(gray: PixelData, row: number): Float32Array {
  const clamped = Math.max(0, Math.min(gray.height - 1, row));
  const line = new Float32Array(gray.width);
  const start = clamped * gray.width * 4;
  for (let x = 0; x < gray.width; x++) {
    line[x] = gray.data[start + x * 4];
  }
  return line;
}

/* ─── Frequency Analysis ─────────────────────────────────────────────── */

/**
 * 1-D Discrete Fourier Transform magnitude spectrum.
 * Returns N/2 magnitudes (DC is index 0).
 *
 * O(N²) — sufficient for the short scanlines we analyse (≤ 800 px).
 */
export function computeFFTMagnitude1D(signal: Float32Array): Float32Array {
  const N = signal.length;
  const halfN = Math.floor(N / 2);
  if (halfN < 1) return new Float32Array(0);
  const magnitudes = new Float32Array(halfN);

  for (let k = 0; k < halfN; k++) {
    let real = 0;
    let imag = 0;
    const factor = (2 * Math.PI * k) / N;
    for (let n = 0; n < N; n++) {
      const angle = factor * n;
      real += signal[n] * Math.cos(angle);
      imag -= signal[n] * Math.sin(angle);
    }
    magnitudes[k] = Math.sqrt(real * real + imag * imag) / N;
  }
  return magnitudes;
}

/* ─── Histogram ──────────────────────────────────────────────────────── */

/**
 * Compute a 256-bin intensity histogram for a single channel.
 * @param channel 0 = R, 1 = G, 2 = B (for grayscale images all three are identical).
 */
export function histogramAnalysis(
  imageData: PixelData,
  channel: 0 | 1 | 2 = 0,
): HistogramResult {
  const bins = new Array<number>(256).fill(0);
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i + channel];
    bins[val]++;
    sum += val;
  }

  const mean = sum / totalPixels;

  let varianceSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const diff = data[i + channel] - mean;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / totalPixels);

  // Median
  let cumulative = 0;
  let median = 128;
  for (let i = 0; i < 256; i++) {
    cumulative += bins[i];
    if (cumulative >= totalPixels / 2) {
      median = i;
      break;
    }
  }

  // Peaks (local maxima in smoothed histogram, ≥ 1 % of pixels, min distance 10)
  const smoothed = smoothHistogram(bins, 5);
  const peaks: number[] = [];
  for (let i = 5; i < 251; i++) {
    if (
      smoothed[i] > smoothed[i - 1] &&
      smoothed[i] > smoothed[i + 1] &&
      smoothed[i] > totalPixels * 0.01
    ) {
      if (peaks.length === 0 || i - peaks[peaks.length - 1] >= 10) {
        peaks.push(i);
      }
    }
  }

  return { bins, mean, stdDev, peaks, median };
}

function smoothHistogram(bins: number[], radius: number): number[] {
  const out = new Array<number>(256).fill(0);
  for (let i = 0; i < 256; i++) {
    let s = 0;
    let c = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(255, i + radius); j++) {
      s += bins[j];
      c++;
    }
    out[i] = s / c;
  }
  return out;
}

/* ─── Blur ───────────────────────────────────────────────────────────── */

/** Separable Gaussian blur. */
export function applyGaussianBlur(src: PixelData, sigma: number): PixelData {
  const radius = Math.ceil(sigma * 3);
  const size = radius * 2 + 1;
  const kernel = new Float32Array(size);
  let ksum = 0;
  for (let i = 0; i < size; i++) {
    const d = i - radius;
    kernel[i] = Math.exp(-(d * d) / (2 * sigma * sigma));
    ksum += kernel[i];
  }
  for (let i = 0; i < size; i++) kernel[i] /= ksum;

  const { data, width, height } = src;
  const temp = new Uint8ClampedArray(data.length);
  const out = new Uint8ClampedArray(data.length);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = -radius; k <= radius; k++) {
        const sx = Math.min(width - 1, Math.max(0, x + k));
        const si = (y * width + sx) * 4;
        const w = kernel[k + radius];
        r += data[si] * w;
        g += data[si + 1] * w;
        b += data[si + 2] * w;
      }
      const oi = (y * width + x) * 4;
      temp[oi] = Math.round(r);
      temp[oi + 1] = Math.round(g);
      temp[oi + 2] = Math.round(b);
      temp[oi + 3] = 255;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;
      for (let k = -radius; k <= radius; k++) {
        const sy = Math.min(height - 1, Math.max(0, y + k));
        const si = (sy * width + x) * 4;
        const w = kernel[k + radius];
        r += temp[si] * w;
        g += temp[si + 1] * w;
        b += temp[si + 2] * w;
      }
      const oi = (y * width + x) * 4;
      out[oi] = Math.round(r);
      out[oi + 1] = Math.round(g);
      out[oi + 2] = Math.round(b);
      out[oi + 3] = 255;
    }
  }
  return { data: out, width, height };
}
