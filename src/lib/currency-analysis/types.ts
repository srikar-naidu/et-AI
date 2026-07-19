/**
 * Core types for the production-grade counterfeit currency analysis engine.
 * All analysis techniques share these types for consistent reporting.
 */

/* ─── Geometry ───────────────────────────────────────────────────────── */

/** Normalized bounding box (all values 0–1, relative to full image). */
export interface RegionOfInterest {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

/* ─── Findings ───────────────────────────────────────────────────────── */

export interface FindingMetric {
  name: string;
  value: number;
  expected: number;
  unit?: string;
}

export interface Finding {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  metric?: FindingMetric;
}

/* ─── Techniques ─────────────────────────────────────────────────────── */

export type TechniqueId =
  | "microprint"
  | "security_thread"
  | "serial_number"
  | "uv_features";

export type Verdict = "genuine" | "suspicious" | "counterfeit" | "inconclusive";

export interface TechniqueVerdict {
  technique: TechniqueId;
  label: string;
  verdict: Verdict;
  /** 0–1 confidence in the verdict. */
  confidence: number;
  findings: Finding[];
  /** Regions that were examined. */
  analyzedRegions: RegionOfInterest[];
}

/* ─── Pixel Data ─────────────────────────────────────────────────────── */

/** Raw RGBA pixel buffer. */
export interface PixelData {
  /** RGBA pixel data, 4 bytes per pixel. */
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/* ─── Denomination Profiles ──────────────────────────────────────────── */

export interface MicroprintProfile {
  zones: RegionOfInterest[];
  /** [min, max] expected edge density ratio for genuine microprint. */
  expectedEdgeDensityRange: [number, number];
  /** [min, max] normalized FFT peak frequency for genuine microtext. */
  expectedFFTPeakRange: [number, number];
}

export interface SecurityThreadProfile {
  region: RegionOfInterest;
  expectedWindowCount: number;
  /** [min, max] thread width as a fraction of the full note width. */
  threadWidthRatio: [number, number];
}

export interface SerialNumberProfile {
  regions: RegionOfInterest[];
  /** RegExp source string for valid serial format. */
  formatPattern: string;
  characterCount: number;
  validPrefixChars: string[];
}

export interface UVFeatureProfile {
  zones: RegionOfInterest[];
  /** [min, max] expected blue channel dominance ratio. */
  expectedBlueDominanceRange: [number, number];
  /** [min, max] expected colored-fiber pixel density. */
  fiberDensityRange: [number, number];
}

export interface DenominationProfile {
  denomination: number;
  name: string;
  /** width / height. */
  aspectRatio: number;
  /** [min, max] dominant hue in degrees. */
  dominantHueRange: [number, number];
  /** [min, max] dominant saturation (0–1). */
  dominantSatRange: [number, number];
  microprint: MicroprintProfile;
  securityThread: SecurityThreadProfile;
  serialNumber: SerialNumberProfile;
  uvFeatures: UVFeatureProfile;
}

/* ─── Analysis Report ────────────────────────────────────────────────── */

export interface CurrencyAnalysisReport {
  denomination: number | null;
  denominationConfidence: number;
  overallVerdict: Verdict;
  overallConfidence: number;
  techniques: TechniqueVerdict[];
  /** Base-64 data URL of the simulated UV-enhanced image. */
  uvSimulationDataUrl: string | null;
  analysisTimestamp: string;
  analysisDurationMs: number;
}

/* ─── Histogram ──────────────────────────────────────────────────────── */

export interface HistogramResult {
  bins: number[];
  mean: number;
  stdDev: number;
  peaks: number[];
  median: number;
}
