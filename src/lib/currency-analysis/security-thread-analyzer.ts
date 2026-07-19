/**
 * Security Thread Verification
 *
 * Indian banknotes have a windowed metallic/polymer security thread
 * embedded in the paper.  Genuine threads show:
 *   • A narrow, continuous vertical line of distinctive brightness
 *   • Alternating visible / embedded window segments
 *   • Metallic reflectance (bimodal histogram, low saturation)
 *
 * Counterfeit notes typically have the thread printed on the surface
 * (no embossed segments), drawn as a line (no metallic signature), or
 * missing entirely.
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
  histogramAnalysis,
  rgbToHsl,
} from "./image-processing";

/* ─── Defaults ───────────────────────────────────────────────────────── */

const DEFAULT_THREAD_REGION: RegionOfInterest = {
  x: 0.32,
  y: 0.05,
  width: 0.08,
  height: 0.90,
  label: "Security thread zone",
};
const DEFAULT_WINDOW_COUNT = 4;
const DEFAULT_THREAD_WIDTH: [number, number] = [0.01, 0.05];

/* ─── Public API ─────────────────────────────────────────────────────── */

export function analyzeSecurityThread(
  imageData: PixelData,
  profile: DenominationProfile | null,
): TechniqueVerdict {
  const findings: Finding[] = [];
  const threadRegionDef =
    profile?.securityThread.region ?? DEFAULT_THREAD_REGION;
  const expectedWindows =
    profile?.securityThread.expectedWindowCount ?? DEFAULT_WINDOW_COUNT;
  const threadWidthRange =
    profile?.securityThread.threadWidthRatio ?? DEFAULT_THREAD_WIDTH;

  const analyzedRegions: RegionOfInterest[] = [threadRegionDef];
  const region = extractRegion(imageData, threadRegionDef);

  if (region.width < 6 || region.height < 20) {
    return {
      technique: "security_thread",
      label: "Security Thread Verification",
      verdict: "inconclusive",
      confidence: 0,
      findings: [
        {
          code: "ST_REGION_SMALL",
          severity: "warning",
          message: "Thread region too small for analysis.",
        },
      ],
      analyzedRegions,
    };
  }

  const gray = toGrayscale(region);

  /* ── 1. Vertical-line detection via column intensity profiling ────── */

  const colMeans = new Float32Array(gray.width);
  for (let x = 0; x < gray.width; x++) {
    let sum = 0;
    for (let y = 0; y < gray.height; y++) {
      sum += gray.data[(y * gray.width + x) * 4];
    }
    colMeans[x] = sum / gray.height;
  }

  const overallMean =
    colMeans.reduce((a, b) => a + b, 0) / colMeans.length;
  const colStd = Math.sqrt(
    colMeans.reduce((a, v) => a + (v - overallMean) ** 2, 0) /
      colMeans.length,
  );

  // Thread columns differ from the background by > 0.5 σ
  let threadStart = -1;
  let threadEnd = -1;
  for (let x = 0; x < colMeans.length; x++) {
    if (Math.abs(colMeans[x] - overallMean) > colStd * 0.5) {
      if (threadStart === -1) threadStart = x;
      threadEnd = x;
    }
  }

  const threadDetected = threadStart >= 0 && threadEnd > threadStart;
  const threadWidth = threadDetected
    ? (threadEnd - threadStart + 1) / region.width
    : 0;
  const widthOk =
    threadWidth >= threadWidthRange[0] && threadWidth <= threadWidthRange[1];

  // Continuity: what fraction of rows show the thread?
  let continuityScore = 0;
  if (threadDetected) {
    const mid = Math.floor((threadStart + threadEnd) / 2);
    let rows = 0;
    for (let y = 0; y < gray.height; y++) {
      if (
        Math.abs(gray.data[(y * gray.width + mid) * 4] - overallMean) >
        colStd * 0.3
      )
        rows++;
    }
    continuityScore = rows / gray.height;
  }

  findings.push({
    code: threadDetected ? "ST_LINE_DETECTED" : "ST_LINE_MISSING",
    severity: threadDetected ? "info" : "critical",
    message: threadDetected
      ? `Vertical thread detected (width ${(threadWidth * 100).toFixed(1)}% of zone, continuity ${(continuityScore * 100).toFixed(0)}%).`
      : "No distinct vertical thread feature detected in the expected region.",
    metric: {
      name: "Thread width ratio",
      value: threadWidth,
      expected: (threadWidthRange[0] + threadWidthRange[1]) / 2,
      unit: "ratio",
    },
  });

  /* ── 2. Windowed-pattern analysis ──────────────────────────────────── */

  let windowScore = 0;
  if (threadDetected) {
    // Brightness profile along thread centre-line
    const brightnessProfile = new Float32Array(gray.height);
    for (let y = 0; y < gray.height; y++) {
      let sum = 0;
      let cnt = 0;
      for (
        let x = Math.max(0, threadStart);
        x <= Math.min(gray.width - 1, threadEnd);
        x++
      ) {
        sum += gray.data[(y * gray.width + x) * 4];
        cnt++;
      }
      brightnessProfile[y] = cnt > 0 ? sum / cnt : 0;
    }

    // Count transitions (window boundary = cross of profile mean)
    const profMean =
      brightnessProfile.reduce((a, b) => a + b, 0) /
      brightnessProfile.length;
    const transitions: number[] = [];
    let prevAbove = brightnessProfile[0] > profMean;
    for (let y = 1; y < brightnessProfile.length; y++) {
      const above = brightnessProfile[y] > profMean;
      if (above !== prevAbove) {
        transitions.push(y);
        prevAbove = above;
      }
    }

    const detectedWindows = Math.floor(transitions.length / 2);
    const diff = Math.abs(detectedWindows - expectedWindows);
    windowScore =
      diff === 0 ? 1 : diff <= 2 ? 0.6 : diff <= 4 ? 0.3 : 0.1;

    findings.push({
      code: detectedWindows > 0 ? "ST_WINDOWS_FOUND" : "ST_NO_WINDOWS",
      severity: detectedWindows > 0 ? "info" : "warning",
      message: `Detected ${detectedWindows} window segment${detectedWindows !== 1 ? "s" : ""} (expected ~${expectedWindows}).`,
      metric: {
        name: "Window count",
        value: detectedWindows,
        expected: expectedWindows,
        unit: "windows",
      },
    });
  }

  /* ── 3. Metallic reflectance ───────────────────────────────────────── */

  let metallicScore = 0;
  if (threadDetected) {
    // Build an absolute ROI for just the detected thread strip
    const threadROI: RegionOfInterest = {
      x:
        (threadStart / region.width) * threadRegionDef.width +
        threadRegionDef.x,
      y: threadRegionDef.y,
      width:
        ((threadEnd - threadStart + 1) / region.width) *
        threadRegionDef.width,
      height: threadRegionDef.height,
      label: "Detected thread strip",
    };
    const threadColor = extractRegion(imageData, threadROI);
    const hist = histogramAnalysis(threadColor, 0);

    const bimodal = hist.peaks.length >= 2;
    const highContrast = hist.stdDev > 30;

    // Metallic surfaces have low saturation
    let satSum = 0;
    let satCnt = 0;
    for (let i = 0; i < threadColor.data.length; i += 4) {
      const [, s] = rgbToHsl(
        threadColor.data[i],
        threadColor.data[i + 1],
        threadColor.data[i + 2],
      );
      satSum += s;
      satCnt++;
    }
    const avgSat = satCnt > 0 ? satSum / satCnt : 1;
    const lowSat = avgSat < 0.3;

    metallicScore =
      (bimodal ? 0.4 : 0) +
      (highContrast ? 0.3 : 0) +
      (lowSat ? 0.3 : 0.1);

    findings.push({
      code: metallicScore > 0.5 ? "ST_METALLIC_OK" : "ST_METALLIC_WEAK",
      severity: metallicScore > 0.5 ? "info" : "warning",
      message:
        metallicScore > 0.5
          ? `Thread region shows metallic reflectance (bimodal histogram: ${bimodal}, high contrast: ${highContrast}, low saturation: ${lowSat}).`
          : "Thread region lacks expected metallic properties — may be printed rather than embedded.",
      metric: {
        name: "Metallic score",
        value: metallicScore,
        expected: 0.7,
        unit: "score",
      },
    });
  }

  /* ── Aggregate ─────────────────────────────────────────────────────── */

  const lineScore = threadDetected
    ? (widthOk ? 0.8 : 0.4) + continuityScore * 0.2
    : 0;
  const confidence = Math.min(
    1,
    lineScore * 0.35 + windowScore * 0.35 + metallicScore * 0.3,
  );

  const verdict: TechniqueVerdict["verdict"] =
    confidence >= 0.65
      ? "genuine"
      : confidence >= 0.35
        ? "suspicious"
        : threadDetected
          ? "counterfeit"
          : "inconclusive";

  return {
    technique: "security_thread",
    label: "Security Thread Verification",
    verdict,
    confidence: Math.round(confidence * 1000) / 1000,
    findings,
    analyzedRegions,
  };
}
