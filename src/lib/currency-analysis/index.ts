/**
 * Currency Analysis Engine — Orchestrator
 *
 * Entry point that:
 *  1. Down-scales the input image for performance
 *  2. Detects the denomination via colour / aspect-ratio matching
 *  3. Runs all four analysis techniques in sequence
 *  4. Generates a simulated UV image
 *  5. Aggregates verdicts into one CurrencyAnalysisReport
 *
 * Runs entirely in the browser — no server round-trip required.
 */

import type {
  PixelData,
  CurrencyAnalysisReport,
  DenominationProfile,
  Verdict,
  TechniqueVerdict,
} from "./types";
import { DENOMINATION_PROFILES } from "./denomination-profiles";
import { resizeForAnalysis, rgbToHsl } from "./image-processing";
import { analyzeMicroprint } from "./microprint-analyzer";
import { analyzeSecurityThread } from "./security-thread-analyzer";
import { analyzeSerialNumber } from "./serial-number-analyzer";
import { analyzeUVFeatures, generateUVSimulation } from "./uv-feature-analyzer";

/* ─── Denomination Detection ─────────────────────────────────────────── */

function detectDenomination(imageData: PixelData): {
  profile: DenominationProfile | null;
  confidence: number;
} {
  // Sample up to ~2 000 pixels for speed
  const step = Math.max(1, Math.floor((imageData.data.length / 4) / 2000));
  let hueSum = 0;
  let satSum = 0;
  let count = 0;

  for (let i = 0; i < imageData.data.length; i += 4 * step) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const [h, s, l] = rgbToHsl(r, g, b);
    if (s > 0.05 && l > 0.1 && l < 0.9) {
      hueSum += h;
      satSum += s;
      count++;
    }
  }

  if (count === 0) return { profile: null, confidence: 0 };

  const avgHue = hueSum / count;
  const avgSat = satSum / count;
  const ar = imageData.width / imageData.height;

  let best: DenominationProfile | null = null;
  let bestScore = 0;

  for (const p of DENOMINATION_PROFILES) {
    // Hue distance (handles wrap-around)
    const [hMin, hMax] = p.dominantHueRange;
    let hDist: number;
    if (hMin <= hMax) {
      hDist =
        avgHue >= hMin && avgHue <= hMax
          ? 0
          : Math.min(
              Math.abs(avgHue - hMin),
              Math.abs(avgHue - hMax),
            );
    } else {
      hDist =
        avgHue >= hMin || avgHue <= hMax
          ? 0
          : Math.min(
              Math.abs(avgHue - hMin),
              Math.abs(avgHue - hMax),
            );
    }
    const hScore = Math.max(0, 1 - hDist / 60);

    // Saturation
    const [sMin, sMax] = p.dominantSatRange;
    const sScore =
      avgSat >= sMin && avgSat <= sMax
        ? 1
        : Math.max(
            0,
            1 -
              Math.min(
                Math.abs(avgSat - sMin),
                Math.abs(avgSat - sMax),
              ) /
                0.3,
          );

    // Aspect ratio
    const arScore = Math.max(0, 1 - Math.abs(ar - p.aspectRatio) / 0.5);

    const score = hScore * 0.5 + sScore * 0.2 + arScore * 0.3;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  return {
    profile: bestScore > 0.4 ? best : null,
    confidence: bestScore,
  };
}

/* ─── UV Data-URL Helper ─────────────────────────────────────────────── */

function pixelDataToDataUrl(pd: PixelData): string | null {
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = pd.width;
    canvas.height = pd.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const imgData = new ImageData(
      new Uint8ClampedArray(pd.data),
      pd.width,
      pd.height,
    );
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

/* ─── Public API ─────────────────────────────────────────────────────── */

export async function analyzeCurrency(
  imageData: PixelData,
): Promise<CurrencyAnalysisReport> {
  const start = performance.now();

  // 1. Down-scale
  const resized = resizeForAnalysis(imageData);

  // 2. Denomination detection
  const { profile, confidence: denomConf } = detectDenomination(resized);

  // 3. Run all four techniques
  const techniques: TechniqueVerdict[] = [
    analyzeMicroprint(resized, profile),
    analyzeSecurityThread(resized, profile),
    analyzeSerialNumber(resized, profile),
    analyzeUVFeatures(resized, profile),
  ];

  // 4. UV simulation
  const uvSim = generateUVSimulation(resized);
  const uvSimulationDataUrl = pixelDataToDataUrl(uvSim);

  // 5. Aggregate overall verdict
  const avgConf =
    techniques.reduce((s, t) => s + t.confidence, 0) / techniques.length;
  const cntCounterfeit = techniques.filter(
    (t) => t.verdict === "counterfeit",
  ).length;
  const cntSuspicious = techniques.filter(
    (t) => t.verdict === "suspicious",
  ).length;
  const cntGenuine = techniques.filter(
    (t) => t.verdict === "genuine",
  ).length;

  let overallVerdict: Verdict;
  if (cntCounterfeit >= 2) overallVerdict = "counterfeit";
  else if (cntCounterfeit === 1 && cntSuspicious >= 1)
    overallVerdict = "counterfeit";
  else if (cntCounterfeit === 1 || cntSuspicious >= 2)
    overallVerdict = "suspicious";
  else if (cntGenuine >= 3) overallVerdict = "genuine";
  else overallVerdict = "suspicious";

  return {
    denomination: profile?.denomination ?? null,
    denominationConfidence: Math.round(denomConf * 1000) / 1000,
    overallVerdict,
    overallConfidence: Math.round(Math.min(1, avgConf) * 1000) / 1000,
    techniques,
    uvSimulationDataUrl,
    analysisTimestamp: new Date().toISOString(),
    analysisDurationMs: Math.round(performance.now() - start),
  };
}

/* ─── Re-exports for consumers ───────────────────────────────────────── */

export type {
  CurrencyAnalysisReport,
  TechniqueVerdict,
  TechniqueId,
  Verdict,
  Finding,
  RegionOfInterest,
  PixelData,
} from "./types";
