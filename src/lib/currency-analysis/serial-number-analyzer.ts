/**
 * Serial Number Pattern Validation
 *
 * Each Indian banknote has two serial numbers (top-left, bottom-right).
 * Genuine serials are intaglio-printed (raised ink), follow a strict
 * format (inset-letter + 2 letters + 6 digits), and the two numbers
 * on one note must match.
 *
 * This module performs:
 *  1. Character segmentation via adaptive thresholding
 *  2. Character-count + spacing-regularity analysis
 *  3. Print-quality measurement (edge sharpness of characters)
 *  4. Contrast analysis (text vs. background)
 *  5. Dual-number consistency check
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
  adaptiveThreshold,
  sobelEdgeDetection,
  computeEdgeDensity,
  histogramAnalysis,
} from "./image-processing";

/* ─── Defaults ───────────────────────────────────────────────────────── */

const DEFAULT_REGIONS: RegionOfInterest[] = [
  { x: 0.04, y: 0.08, width: 0.32, height: 0.10, label: "Top-left serial" },
  {
    x: 0.62,
    y: 0.82,
    width: 0.32,
    height: 0.10,
    label: "Bottom-right serial",
  },
];
const DEFAULT_CHAR_COUNT = 9;

/* ─── Public API ─────────────────────────────────────────────────────── */

export function analyzeSerialNumber(
  imageData: PixelData,
  profile: DenominationProfile | null,
): TechniqueVerdict {
  const findings: Finding[] = [];
  const regions = profile?.serialNumber.regions ?? DEFAULT_REGIONS;
  const expectedChars =
    profile?.serialNumber.characterCount ?? DEFAULT_CHAR_COUNT;
  const analyzedRegions: RegionOfInterest[] = [...regions];

  let totalScore = 0;
  let regionCount = 0;
  const charCounts: number[] = [];

  for (const regionDef of regions) {
    regionCount++;
    const roi = extractRegion(imageData, regionDef);

    if (roi.width < 10 || roi.height < 5) {
      findings.push({
        code: "SN_REGION_SMALL",
        severity: "warning",
        message: `${regionDef.label}: Region too small for serial number analysis.`,
      });
      continue;
    }

    const gray = toGrayscale(roi);

    /* ── 1. Character segmentation ───────────────────────────────────── */

    const blockSize =
      Math.max(3, Math.floor(Math.min(roi.width, roi.height) / 4)) | 1; // ensure odd
    const binary = adaptiveThreshold(gray, blockSize, 10);

    // Column dark-pixel profile → detect occupied / gap columns
    const colProfile = new Float32Array(binary.width);
    for (let x = 0; x < binary.width; x++) {
      let dark = 0;
      for (let y = 0; y < binary.height; y++) {
        if (binary.data[(y * binary.width + x) * 4] < 128) dark++;
      }
      colProfile[x] = dark / binary.height;
    }

    const charThreshold = 0.15;
    let inChar = false;
    let detectedChars = 0;
    const charWidths: number[] = [];
    let curWidth = 0;

    for (let x = 0; x < colProfile.length; x++) {
      if (colProfile[x] > charThreshold) {
        if (!inChar) {
          inChar = true;
          curWidth = 0;
          detectedChars++;
        }
        curWidth++;
      } else {
        if (inChar) {
          charWidths.push(curWidth);
          inChar = false;
        }
      }
    }
    if (inChar) charWidths.push(curWidth);

    // Filter tiny blobs (noise)
    const medianWidth =
      charWidths.length > 0
        ? [...charWidths].sort((a, b) => a - b)[
            Math.floor(charWidths.length / 2)
          ]
        : 0;
    const validChars = charWidths.filter(
      (w) => w >= medianWidth * 0.4,
    ).length;

    charCounts.push(validChars);

    const countDiff = Math.abs(validChars - expectedChars);
    const countScore =
      countDiff === 0 ? 1.0 : countDiff <= 1 ? 0.7 : countDiff <= 3 ? 0.4 : 0.1;

    findings.push({
      code: countDiff <= 1 ? "SN_COUNT_OK" : "SN_COUNT_MISMATCH",
      severity:
        countDiff <= 1 ? "info" : countDiff <= 3 ? "warning" : "critical",
      message: `${regionDef.label}: Detected ~${validChars} character segments (expected ${expectedChars}).`,
      metric: {
        name: "Character count",
        value: validChars,
        expected: expectedChars,
        unit: "chars",
      },
    });

    /* ── 2. Spacing regularity ───────────────────────────────────────── */

    let spacingScore = 0;
    if (charWidths.length >= 3) {
      const wMean =
        charWidths.reduce((a, b) => a + b, 0) / charWidths.length;
      const wStd = Math.sqrt(
        charWidths.reduce((a, w) => a + (w - wMean) ** 2, 0) /
          charWidths.length,
      );
      const wCV = wMean > 0 ? wStd / wMean : 999;
      spacingScore =
        wCV < 0.25 ? 1.0 : wCV < 0.5 ? 0.6 : wCV < 0.8 ? 0.3 : 0.1;

      findings.push({
        code:
          spacingScore > 0.5
            ? "SN_SPACING_REGULAR"
            : "SN_SPACING_IRREGULAR",
        severity: spacingScore > 0.5 ? "info" : "warning",
        message:
          spacingScore > 0.5
            ? `${regionDef.label}: Character spacing is uniform (CV ${wCV.toFixed(2)}).`
            : `${regionDef.label}: Irregular character spacing (CV ${wCV.toFixed(2)}) — inconsistent with intaglio printing.`,
        metric: {
          name: "Width CV",
          value: wCV,
          expected: 0.25,
          unit: "ratio",
        },
      });
    }

    /* ── 3. Print quality (edge sharpness) ───────────────────────────── */

    const edges = sobelEdgeDetection(gray);
    const edgeDensity = computeEdgeDensity(edges, 40);
    const qualityScore =
      edgeDensity >= 0.1 && edgeDensity <= 0.4
        ? 1.0
        : edgeDensity < 0.1
          ? edgeDensity / 0.1
          : Math.max(0, 1 - (edgeDensity - 0.4) / 0.3);

    findings.push({
      code: qualityScore > 0.5 ? "SN_PRINT_SHARP" : "SN_PRINT_FUZZY",
      severity: qualityScore > 0.5 ? "info" : "warning",
      message:
        qualityScore > 0.5
          ? `${regionDef.label}: Print quality is sharp, consistent with intaglio printing.`
          : `${regionDef.label}: Print quality ${edgeDensity < 0.1 ? "blurry — possible inkjet/laser" : "noisy — possible photocopy"}.`,
      metric: {
        name: "Edge density",
        value: edgeDensity,
        expected: 0.22,
        unit: "ratio",
      },
    });

    /* ── 4. Contrast ─────────────────────────────────────────────────── */

    const hist = histogramAnalysis(gray, 0);
    const contrastScore =
      hist.stdDev > 50 ? 1.0 : hist.stdDev > 30 ? 0.6 : 0.2;

    findings.push({
      code: contrastScore > 0.5 ? "SN_CONTRAST_OK" : "SN_CONTRAST_LOW",
      severity: contrastScore > 0.5 ? "info" : "warning",
      message:
        contrastScore > 0.5
          ? `${regionDef.label}: Good contrast between text and background.`
          : `${regionDef.label}: Low contrast — serial numbers may be faded or poorly printed.`,
      metric: {
        name: "Contrast (σ)",
        value: hist.stdDev,
        expected: 60,
        unit: "levels",
      },
    });

    /* ── Per-region aggregate ────────────────────────────────────────── */

    totalScore +=
      countScore * 0.3 +
      spacingScore * 0.25 +
      qualityScore * 0.25 +
      contrastScore * 0.2;
  }

  /* ── 5. Dual-number consistency ──────────────────────────────────── */

  if (charCounts.length === 2) {
    const consistent = Math.abs(charCounts[0] - charCounts[1]) <= 1;
    findings.push({
      code: consistent ? "SN_DUAL_MATCH" : "SN_DUAL_MISMATCH",
      severity: consistent ? "info" : "critical",
      message: consistent
        ? `Both serial number regions show similar character structure (${charCounts[0]} / ${charCounts[1]}).`
        : `Serial number regions differ significantly (${charCounts[0]} vs ${charCounts[1]}) — critical red flag.`,
    });
    if (!consistent) totalScore *= 0.5;
  }

  /* ── Final verdict ─────────────────────────────────────────────────── */

  const confidence =
    regionCount > 0 ? Math.min(1, totalScore / regionCount) : 0;
  const verdict: TechniqueVerdict["verdict"] =
    confidence >= 0.65
      ? "genuine"
      : confidence >= 0.35
        ? "suspicious"
        : confidence > 0
          ? "counterfeit"
          : "inconclusive";

  return {
    technique: "serial_number",
    label: "Serial Number Validation",
    verdict,
    confidence: Math.round(confidence * 1000) / 1000,
    findings,
    analyzedRegions,
  };
}
