/**
 * Microprint Analysis
 *
 * Genuine Indian banknotes contain microscopic text (0.2–0.3 mm high) —
 * "RBI", "भारत", denomination values — that consumer printers cannot
 * faithfully reproduce.
 *
 * Detection pipeline:
 *  1. Edge-density measurement (Sobel) — genuine microprint has regular,
 *     high edge density; fakes are either too smooth or noisy.
 *  2. 1-D FFT on horizontal scan-lines — genuine text produces strong
 *     peaks at the letter-spacing frequency; fakes lack these peaks.
 *  3. Local-variance consistency — genuine text has stable variance
 *     patterns; counterfeits are either too uniform or chaotic.
 */

import type {
  PixelData,
  TechniqueVerdict,
  Finding,
  DenominationProfile,
  RegionOfInterest,
} from "./types";
import {
  extractRegion,
  toGrayscale,
  sobelEdgeDetection,
  computeEdgeDensity,
  extractScanline,
  computeFFTMagnitude1D,
  computeLocalVariance,
} from "./image-processing";

/* ─── Defaults for unknown denomination ──────────────────────────────── */

const DEFAULT_ZONES: RegionOfInterest[] = [
  { x: 0.28, y: 0.15, width: 0.15, height: 0.70, label: "Thread-adjacent band" },
  { x: 0.05, y: 0.02, width: 0.40, height: 0.06, label: "Top text band" },
  { x: 0.05, y: 0.88, width: 0.40, height: 0.06, label: "Bottom text band" },
];
const DEFAULT_EDGE_RANGE: [number, number] = [0.08, 0.45];
const DEFAULT_FFT_RANGE: [number, number] = [0.05, 0.35];

/* ─── Helpers ────────────────────────────────────────────────────────── */

function scoreInRange(value: number, min: number, max: number): number {
  if (value >= min && value <= max) return 1.0;
  if (value < min) return Math.max(0, value / min);
  return Math.max(0, 1 - (value - max) / 0.3);
}

/* ─── Public API ─────────────────────────────────────────────────────── */

export function analyzeMicroprint(
  imageData: PixelData,
  profile: DenominationProfile | null,
): TechniqueVerdict {
  const findings: Finding[] = [];
  const analyzedRegions: RegionOfInterest[] = [];

  const zones = profile?.microprint.zones ?? DEFAULT_ZONES;
  const expectedEdge = profile?.microprint.expectedEdgeDensityRange ?? DEFAULT_EDGE_RANGE;
  const expectedFFT = profile?.microprint.expectedFFTPeakRange ?? DEFAULT_FFT_RANGE;

  let totalScore = 0;
  let zoneCount = 0;

  for (const zone of zones) {
    analyzedRegions.push(zone);
    zoneCount++;

    const region = extractRegion(imageData, zone);
    if (region.width < 4 || region.height < 4) {
      findings.push({
        code: "MP_REGION_TOO_SMALL",
        severity: "warning",
        message: `Region "${zone.label}" too small for microprint analysis.`,
      });
      continue;
    }

    const gray = toGrayscale(region);

    /* ── 1. Edge density ─────────────────────────────────────────────── */
    const edges = sobelEdgeDetection(gray);
    const edgeDensity = computeEdgeDensity(edges, 30);
    const edgeOk =
      edgeDensity >= expectedEdge[0] && edgeDensity <= expectedEdge[1];
    const edgeScore = scoreInRange(edgeDensity, expectedEdge[0], expectedEdge[1]);

    findings.push({
      code: edgeOk
        ? "MP_EDGE_OK"
        : edgeDensity < expectedEdge[0]
          ? "MP_EDGE_LOW"
          : "MP_EDGE_HIGH",
      severity: edgeOk ? "info" : edgeDensity < expectedEdge[0] ? "critical" : "warning",
      message: edgeOk
        ? `${zone.label}: Edge density ${(edgeDensity * 100).toFixed(1)}% — consistent with genuine microprint.`
        : edgeDensity < expectedEdge[0]
          ? `${zone.label}: Edge density ${(edgeDensity * 100).toFixed(1)}% — too smooth, microprint may be absent or blurred.`
          : `${zone.label}: Edge density ${(edgeDensity * 100).toFixed(1)}% — excessively noisy, possible scan/photocopy artifact.`,
      metric: {
        name: "Edge density",
        value: edgeDensity,
        expected: (expectedEdge[0] + expectedEdge[1]) / 2,
        unit: "ratio",
      },
    });

    /* ── 2. FFT frequency analysis ───────────────────────────────────── */
    const numScanlines = Math.min(5, Math.floor(gray.height / 3));
    let fftScore = 0;

    for (let s = 0; s < numScanlines; s++) {
      const row = Math.floor((gray.height * (s + 1)) / (numScanlines + 1));
      const scanline = extractScanline(gray, row);

      // De-trend (remove DC)
      const mean =
        scanline.reduce((a, b) => a + b, 0) / scanline.length;
      const detrended = new Float32Array(scanline.length);
      for (let i = 0; i < scanline.length; i++)
        detrended[i] = scanline[i] - mean;

      const fft = computeFFTMagnitude1D(detrended);
      if (fft.length < 4) continue;

      // Find dominant frequency (skip DC at index 0)
      let maxMag = 0;
      let maxIdx = 1;
      for (let k = 1; k < fft.length; k++) {
        if (fft[k] > maxMag) {
          maxMag = fft[k];
          maxIdx = k;
        }
      }
      const normFreq = maxIdx / fft.length;
      const inRange =
        normFreq >= expectedFFT[0] && normFreq <= expectedFFT[1];

      // Peak strength relative to noise floor
      const noiseFloor =
        fft.reduce((a, b) => a + b, 0) / fft.length;
      const peakRatio = noiseFloor > 0 ? maxMag / noiseFloor : 0;
      fftScore +=
        (inRange ? 1 : 0.3) * Math.min(1, peakRatio / 5);
    }
    fftScore =
      numScanlines > 0 ? fftScore / numScanlines : 0;

    findings.push({
      code: fftScore > 0.5 ? "MP_FFT_PEAKS_FOUND" : "MP_FFT_NO_PEAKS",
      severity: fftScore > 0.5 ? "info" : "warning",
      message:
        fftScore > 0.5
          ? `${zone.label}: Periodic micro-text patterns detected in frequency analysis.`
          : `${zone.label}: Weak or absent periodic patterns — microprint may be missing.`,
      metric: {
        name: "FFT peak score",
        value: fftScore,
        expected: 0.6,
        unit: "score",
      },
    });

    /* ── 3. Local-variance consistency ───────────────────────────────── */
    const windowSize = Math.max(
      3,
      Math.floor(Math.min(gray.width, gray.height) / 20),
    );
    const variances = computeLocalVariance(gray, windowSize);

    let vMean = 0;
    let vCount = 0;
    for (let i = 0; i < variances.length; i++) {
      if (variances[i] > 0) {
        vMean += variances[i];
        vCount++;
      }
    }
    vMean = vCount > 0 ? vMean / vCount : 0;

    let vStd = 0;
    for (let i = 0; i < variances.length; i++) {
      if (variances[i] > 0) {
        const d = variances[i] - vMean;
        vStd += d * d;
      }
    }
    vStd = vCount > 1 ? Math.sqrt(vStd / (vCount - 1)) : 0;

    const cv = vMean > 0 ? vStd / vMean : 999;
    // Genuine microprint: consistent texture → CV ∈ [0.3, 1.5]
    const varianceScore =
      cv >= 0.3 && cv <= 1.5
        ? 1.0
        : cv < 0.3
          ? cv / 0.3
          : Math.max(0, 1 - (cv - 1.5) / 2);

    findings.push({
      code:
        varianceScore > 0.5
          ? "MP_TEXTURE_CONSISTENT"
          : "MP_TEXTURE_ABNORMAL",
      severity: varianceScore > 0.5 ? "info" : "warning",
      message:
        varianceScore > 0.5
          ? `${zone.label}: Texture consistency matches genuine microprint characteristics.`
          : `${zone.label}: Texture inconsistency — ${
              cv < 0.3
                ? "region too uniform (possible blank or solid print)"
                : "excessive noise (possible photocopy artifact)"
            }.`,
      metric: {
        name: "Texture CV",
        value: cv,
        expected: 0.9,
        unit: "ratio",
      },
    });

    /* ── Weighted zone score ─────────────────────────────────────────── */
    totalScore += edgeScore * 0.4 + fftScore * 0.35 + varianceScore * 0.25;
  }

  const confidence =
    zoneCount > 0 ? Math.min(1, totalScore / zoneCount) : 0;
  const verdict: TechniqueVerdict["verdict"] =
    confidence >= 0.7
      ? "genuine"
      : confidence >= 0.4
        ? "suspicious"
        : confidence > 0
          ? "counterfeit"
          : "inconclusive";

  return {
    technique: "microprint",
    label: "Microprint Analysis",
    verdict,
    confidence: Math.round(confidence * 1000) / 1000,
    findings,
    analyzedRegions,
  };
}
