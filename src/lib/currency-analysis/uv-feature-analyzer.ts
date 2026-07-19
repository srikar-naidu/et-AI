/**
 * UV Feature Simulation & Analysis
 *
 * Under UV light genuine Indian notes show:
 *   • Fluorescent denomination numeral and RBI seal
 *   • Controlled paper fluorescence (not bright-white like printer paper)
 *   • Embedded red and blue fluorescent fibres
 *   • Security-ink pigments with distinct spectral signatures
 *
 * This module:
 *   1. Analyses blue-channel dominance in UV-reactive zones
 *   2. Checks the paper baseline for optical-brightener contamination
 *   3. Validates ink-pigment hue concentration
 *   4. Detects embedded coloured fibres
 *   5. Generates a simulated UV-enhanced image for visual inspection
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
  separateChannels,
  rgbToHsl,
} from "./image-processing";

/* ─── Defaults ───────────────────────────────────────────────────────── */

const DEFAULT_UV_ZONES: RegionOfInterest[] = [
  { x: 0.10, y: 0.30, width: 0.25, height: 0.35, label: "Denomination numeral area" },
  { x: 0.70, y: 0.20, width: 0.20, height: 0.30, label: "RBI seal area" },
  { x: 0.05, y: 0.05, width: 0.90, height: 0.90, label: "Full-note fiber zone" },
];
const DEFAULT_BLUE_RANGE: [number, number] = [0.33, 0.55];
const DEFAULT_FIBER_RANGE: [number, number] = [0.001, 0.02];

/* ─── Public API — analysis ──────────────────────────────────────────── */

export function analyzeUVFeatures(
  imageData: PixelData,
  profile: DenominationProfile | null,
): TechniqueVerdict {
  const findings: Finding[] = [];
  const zones = profile?.uvFeatures.zones ?? DEFAULT_UV_ZONES;
  const expectedBlue =
    profile?.uvFeatures.expectedBlueDominanceRange ?? DEFAULT_BLUE_RANGE;
  const expectedFiber =
    profile?.uvFeatures.fiberDensityRange ?? DEFAULT_FIBER_RANGE;
  const analyzedRegions: RegionOfInterest[] = [...zones];

  let totalScore = 0;
  let analysisCount = 0;

  /* ── 1. Blue-channel dominance in UV-reactive zones ────────────────── */

  for (const zone of zones.filter(
    (z) => !z.label.toLowerCase().includes("fiber"),
  )) {
    analysisCount++;
    const region = extractRegion(imageData, zone);
    if (region.width < 4 || region.height < 4) continue;

    const { r, g, b } = separateChannels(region);
    const totalPixels = region.width * region.height;

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    for (let i = 0; i < totalPixels; i++) {
      rSum += r[i];
      gSum += g[i];
      bSum += b[i];
    }
    const channelTotal = rSum + gSum + bSum;
    const blueRatio = channelTotal > 0 ? bSum / channelTotal : 0.333;

    const inRange =
      blueRatio >= expectedBlue[0] && blueRatio <= expectedBlue[1];
    const blueScore = inRange
      ? 1.0
      : blueRatio < expectedBlue[0]
        ? blueRatio / expectedBlue[0]
        : Math.max(0, 1 - (blueRatio - expectedBlue[1]) / 0.2);

    findings.push({
      code: inRange
        ? "UV_BLUE_OK"
        : blueRatio < expectedBlue[0]
          ? "UV_BLUE_LOW"
          : "UV_BLUE_HIGH",
      severity: inRange ? "info" : "warning",
      message: inRange
        ? `${zone.label}: Blue-channel ratio ${(blueRatio * 100).toFixed(1)}% — consistent with UV-reactive ink.`
        : `${zone.label}: Blue-channel ratio ${(blueRatio * 100).toFixed(1)}% — ${
            blueRatio < expectedBlue[0]
              ? "lower than expected for genuine UV ink"
              : "higher than expected, possible paper brightener"
          }.`,
      metric: {
        name: "Blue ratio",
        value: blueRatio,
        expected: (expectedBlue[0] + expectedBlue[1]) / 2,
        unit: "ratio",
      },
    });

    totalScore += blueScore;
  }

  /* ── 2. Paper fluorescence baseline ────────────────────────────────── */

  {
    analysisCount++;
    const paperROI: RegionOfInterest = {
      x: 0.85,
      y: 0.85,
      width: 0.10,
      height: 0.10,
      label: "Paper baseline",
    };
    const paperRegion = extractRegion(imageData, paperROI);
    const { r, g, b } = separateChannels(paperRegion);
    const total = paperRegion.width * paperRegion.height;

    let rMean = 0;
    let gMean = 0;
    let bMean = 0;
    for (let i = 0; i < total; i++) {
      rMean += r[i];
      gMean += g[i];
      bMean += b[i];
    }
    rMean /= total;
    gMean /= total;
    bMean /= total;

    const brightness = (rMean + gMean + bMean) / 3;
    const blueBias = bMean - (rMean + gMean) / 2;

    const paperScore =
      brightness < 230 && blueBias < 15
        ? 1.0
        : brightness >= 230
          ? Math.max(0, 1 - (brightness - 230) / 25)
          : Math.max(0, 1 - (blueBias - 15) / 30);

    findings.push({
      code: paperScore > 0.5 ? "UV_PAPER_OK" : "UV_PAPER_BRIGHTENER",
      severity: paperScore > 0.5 ? "info" : "warning",
      message:
        paperScore > 0.5
          ? `Paper baseline shows controlled fluorescence (brightness ${brightness.toFixed(0)}, blue bias ${blueBias.toFixed(1)}).`
          : `Paper may contain optical brighteners (brightness ${brightness.toFixed(0)}, blue bias ${blueBias.toFixed(1)}) — inconsistent with genuine currency paper.`,
      metric: {
        name: "Paper brightness",
        value: brightness,
        expected: 190,
        unit: "level",
      },
    });

    totalScore += paperScore;
  }

  /* ── 3. Ink-pigment hue concentration ──────────────────────────────── */

  for (const zone of zones.filter(
    (z) => !z.label.toLowerCase().includes("fiber"),
  )) {
    analysisCount++;
    const region = extractRegion(imageData, zone);
    if (region.width < 4 || region.height < 4) continue;

    const hueHist = new Float32Array(360);
    let chromaPixels = 0;

    for (let i = 0; i < region.data.length; i += 4) {
      const [h, s, l] = rgbToHsl(
        region.data[i],
        region.data[i + 1],
        region.data[i + 2],
      );
      if (s > 0.05 && l > 0.1 && l < 0.9) {
        hueHist[Math.floor(h) % 360]++;
        chromaPixels++;
      }
    }

    // Find dominant hue
    let domHue = 0;
    let maxCnt = 0;
    for (let h = 0; h < 360; h++) {
      if (hueHist[h] > maxCnt) {
        maxCnt = hueHist[h];
        domHue = h;
      }
    }

    let nearDom = 0;
    for (let h = domHue - 15; h <= domHue + 15; h++) {
      nearDom += hueHist[(h + 360) % 360];
    }
    const hueConc = chromaPixels > 0 ? nearDom / chromaPixels : 0;

    const inkScore =
      hueConc > 0.4 ? 1.0 : hueConc > 0.2 ? 0.5 : 0.2;

    findings.push({
      code: inkScore > 0.5 ? "UV_INK_CONSISTENT" : "UV_INK_DISPERSED",
      severity: inkScore > 0.5 ? "info" : "warning",
      message:
        inkScore > 0.5
          ? `${zone.label}: Ink pigment hue concentration ${(hueConc * 100).toFixed(0)}% near ${domHue}° — consistent with security ink.`
          : `${zone.label}: Dispersed hue distribution (${(hueConc * 100).toFixed(0)}%) — may indicate consumer printer ink.`,
      metric: {
        name: "Hue concentration",
        value: hueConc,
        expected: 0.5,
        unit: "ratio",
      },
    });

    totalScore += inkScore;
  }

  /* ── 4. Fibre detection ────────────────────────────────────────────── */

  {
    analysisCount++;
    const fiberZone =
      zones.find((z) => z.label.toLowerCase().includes("fiber")) ??
      zones[zones.length - 1];
    const fiberRegion = extractRegion(imageData, fiberZone);

    if (fiberRegion.width >= 10 && fiberRegion.height >= 10) {
      let fiberPixels = 0;
      const total = fiberRegion.width * fiberRegion.height;

      for (let i = 0; i < fiberRegion.data.length; i += 4) {
        const [h, s, l] = rgbToHsl(
          fiberRegion.data[i],
          fiberRegion.data[i + 1],
          fiberRegion.data[i + 2],
        );
        const isRed =
          (h >= 340 || h <= 20) && s > 0.3 && l > 0.2 && l < 0.7;
        const isBlue =
          h >= 200 && h <= 250 && s > 0.3 && l > 0.2 && l < 0.7;
        if (isRed || isBlue) fiberPixels++;
      }

      const fiberDensity = fiberPixels / total;
      const inRange =
        fiberDensity >= expectedFiber[0] &&
        fiberDensity <= expectedFiber[1];

      const fiberScore = inRange
        ? 1.0
        : fiberDensity < expectedFiber[0]
          ? Math.max(0.1, fiberDensity / expectedFiber[0])
          : Math.max(0, 1 - (fiberDensity - expectedFiber[1]) / 0.05);

      findings.push({
        code: inRange
          ? "UV_FIBERS_OK"
          : fiberDensity < expectedFiber[0]
            ? "UV_FIBERS_LOW"
            : "UV_FIBERS_HIGH",
        severity: inRange ? "info" : "warning",
        message: inRange
          ? `Fluorescent fibre density ${(fiberDensity * 100).toFixed(2)}% — within expected range for genuine currency paper.`
          : fiberDensity < expectedFiber[0]
            ? `Low fluorescent fibre density ${(fiberDensity * 100).toFixed(2)}% — genuine notes have embedded coloured fibres.`
            : `High coloured-pixel density ${(fiberDensity * 100).toFixed(2)}% — may be printed artefacts rather than embedded fibres.`,
        metric: {
          name: "Fibre density",
          value: fiberDensity,
          expected: (expectedFiber[0] + expectedFiber[1]) / 2,
          unit: "ratio",
        },
      });

      totalScore += fiberScore;
    }
  }

  /* ── Aggregate ─────────────────────────────────────────────────────── */

  const confidence =
    analysisCount > 0 ? Math.min(1, totalScore / analysisCount) : 0;
  const verdict: TechniqueVerdict["verdict"] =
    confidence >= 0.65
      ? "genuine"
      : confidence >= 0.35
        ? "suspicious"
        : confidence > 0
          ? "counterfeit"
          : "inconclusive";

  return {
    technique: "uv_features",
    label: "UV Feature Simulation",
    verdict,
    confidence: Math.round(confidence * 1000) / 1000,
    findings,
    analyzedRegions,
  };
}

/* ─── Public API — UV simulation image ───────────────────────────────── */

/**
 * Generate a simulated UV-light-enhanced version of the banknote image.
 * Mimics the visual appearance under a UV lamp:
 *  • Dark purple ambient
 *  • Security features glow blue-white
 *  • Coloured fibres fluoresce brightly
 */
export function generateUVSimulation(imageData: PixelData): PixelData {
  const { data, width, height } = imageData;
  const out = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const [h, s, l] = rgbToHsl(r, g, b);

    // Base UV appearance: dark purple ambient
    let uvR = r * 0.15;
    let uvG = g * 0.10;
    let uvB = b * 0.60 + 40;

    // Bright areas (security features) glow blue-white
    if (l > 0.6) {
      const glow = (l - 0.6) / 0.4;
      uvR += glow * 60;
      uvG += glow * 80;
      uvB += glow * 120;
    }

    // High-saturation pixels fluoresce
    if (s > 0.25) {
      const factor = s * 1.5;
      if (h >= 340 || h <= 20) {
        // Red fibres → orange-red glow
        uvR += factor * 100;
        uvG += factor * 30;
      } else if (h >= 200 && h <= 260) {
        // Blue fibres → bright blue glow
        uvB += factor * 120;
        uvG += factor * 40;
      } else if (h >= 80 && h <= 150) {
        // Green features → yellow-green glow
        uvG += factor * 100;
        uvR += factor * 30;
      }
    }

    out[i] = Math.min(255, Math.round(uvR));
    out[i + 1] = Math.min(255, Math.round(uvG));
    out[i + 2] = Math.min(255, Math.round(uvB));
    out[i + 3] = 255;
  }

  return { data: out, width, height };
}
