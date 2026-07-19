/**
 * Security-feature locations for each Indian currency denomination
 * (Mahatma Gandhi New Series).
 *
 * All coordinates are normalised 0–1 relative to the full note image
 * captured in landscape orientation (width > height).
 *
 * These were measured from reference images and include generous margins
 * to tolerate typical phone-camera alignment variation.
 */

import type { DenominationProfile } from "./types";

/* ────────────────────────────────────────────────────────────────────── */

const INR_10: DenominationProfile = {
  denomination: 10,
  name: "₹10",
  aspectRatio: 1.952, // 123 × 63 mm
  dominantHueRange: [15, 40],
  dominantSatRange: [0.25, 0.65],
  microprint: {
    zones: [
      { x: 0.28, y: 0.15, width: 0.12, height: 0.70, label: "Thread-adjacent band" },
      { x: 0.05, y: 0.02, width: 0.38, height: 0.07, label: "Top guarantee text" },
    ],
    expectedEdgeDensityRange: [0.07, 0.42],
    expectedFFTPeakRange: [0.05, 0.35],
  },
  securityThread: {
    region: { x: 0.34, y: 0.04, width: 0.08, height: 0.92, label: "Security thread" },
    expectedWindowCount: 3,
    threadWidthRatio: [0.010, 0.045],
  },
  serialNumber: {
    regions: [
      { x: 0.04, y: 0.08, width: 0.30, height: 0.11, label: "Top-left serial" },
      { x: 0.62, y: 0.80, width: 0.30, height: 0.11, label: "Bottom-right serial" },
    ],
    formatPattern: "^[0-9][A-Z]{2}\\s?[0-9]{6}$",
    characterCount: 9,
    validPrefixChars: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  uvFeatures: {
    zones: [
      { x: 0.10, y: 0.28, width: 0.22, height: 0.40, label: "Denomination numeral" },
      { x: 0.68, y: 0.18, width: 0.22, height: 0.30, label: "Ashoka Pillar / RBI seal" },
      { x: 0.05, y: 0.05, width: 0.90, height: 0.90, label: "Full-note fiber zone" },
    ],
    expectedBlueDominanceRange: [0.30, 0.50],
    fiberDensityRange: [0.001, 0.020],
  },
};

/* ────────────────────────────────────────────────────────────────────── */

const INR_20: DenominationProfile = {
  denomination: 20,
  name: "₹20",
  aspectRatio: 2.048, // 129 × 63 mm
  dominantHueRange: [55, 90],
  dominantSatRange: [0.15, 0.50],
  microprint: {
    zones: [
      { x: 0.27, y: 0.12, width: 0.13, height: 0.72, label: "Thread-adjacent band" },
      { x: 0.04, y: 0.02, width: 0.40, height: 0.07, label: "Top guarantee text" },
    ],
    expectedEdgeDensityRange: [0.07, 0.42],
    expectedFFTPeakRange: [0.05, 0.35],
  },
  securityThread: {
    region: { x: 0.33, y: 0.04, width: 0.08, height: 0.92, label: "Security thread" },
    expectedWindowCount: 3,
    threadWidthRatio: [0.010, 0.045],
  },
  serialNumber: {
    regions: [
      { x: 0.04, y: 0.08, width: 0.30, height: 0.11, label: "Top-left serial" },
      { x: 0.62, y: 0.80, width: 0.30, height: 0.11, label: "Bottom-right serial" },
    ],
    formatPattern: "^[0-9][A-Z]{2}\\s?[0-9]{6}$",
    characterCount: 9,
    validPrefixChars: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  uvFeatures: {
    zones: [
      { x: 0.10, y: 0.28, width: 0.22, height: 0.40, label: "Denomination numeral" },
      { x: 0.68, y: 0.18, width: 0.22, height: 0.30, label: "Ashoka Pillar / RBI seal" },
      { x: 0.05, y: 0.05, width: 0.90, height: 0.90, label: "Full-note fiber zone" },
    ],
    expectedBlueDominanceRange: [0.30, 0.50],
    fiberDensityRange: [0.001, 0.020],
  },
};

/* ────────────────────────────────────────────────────────────────────── */

const INR_50: DenominationProfile = {
  denomination: 50,
  name: "₹50",
  aspectRatio: 2.045, // 135 × 66 mm
  dominantHueRange: [195, 240],
  dominantSatRange: [0.15, 0.55],
  microprint: {
    zones: [
      { x: 0.26, y: 0.12, width: 0.14, height: 0.72, label: "Thread-adjacent band" },
      { x: 0.04, y: 0.02, width: 0.40, height: 0.07, label: "Top guarantee text" },
      { x: 0.04, y: 0.88, width: 0.40, height: 0.07, label: "Bottom denomination band" },
    ],
    expectedEdgeDensityRange: [0.08, 0.44],
    expectedFFTPeakRange: [0.05, 0.35],
  },
  securityThread: {
    region: { x: 0.32, y: 0.04, width: 0.09, height: 0.92, label: "Security thread" },
    expectedWindowCount: 4,
    threadWidthRatio: [0.012, 0.048],
  },
  serialNumber: {
    regions: [
      { x: 0.04, y: 0.07, width: 0.32, height: 0.11, label: "Top-left serial" },
      { x: 0.60, y: 0.80, width: 0.32, height: 0.11, label: "Bottom-right serial" },
    ],
    formatPattern: "^[0-9][A-Z]{2}\\s?[0-9]{6}$",
    characterCount: 9,
    validPrefixChars: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  uvFeatures: {
    zones: [
      { x: 0.10, y: 0.25, width: 0.24, height: 0.42, label: "Denomination numeral" },
      { x: 0.68, y: 0.15, width: 0.24, height: 0.35, label: "Ashoka Pillar / RBI seal" },
      { x: 0.05, y: 0.05, width: 0.90, height: 0.90, label: "Full-note fiber zone" },
    ],
    expectedBlueDominanceRange: [0.32, 0.55],
    fiberDensityRange: [0.001, 0.020],
  },
};

/* ────────────────────────────────────────────────────────────────────── */

const INR_100: DenominationProfile = {
  denomination: 100,
  name: "₹100",
  aspectRatio: 2.152, // 142 × 66 mm
  dominantHueRange: [245, 295],
  dominantSatRange: [0.10, 0.45],
  microprint: {
    zones: [
      { x: 0.26, y: 0.10, width: 0.14, height: 0.75, label: "Thread-adjacent band" },
      { x: 0.04, y: 0.02, width: 0.42, height: 0.07, label: "Top guarantee text" },
      { x: 0.04, y: 0.88, width: 0.42, height: 0.07, label: "Bottom denomination band" },
    ],
    expectedEdgeDensityRange: [0.08, 0.44],
    expectedFFTPeakRange: [0.05, 0.35],
  },
  securityThread: {
    region: { x: 0.31, y: 0.03, width: 0.09, height: 0.94, label: "Security thread" },
    expectedWindowCount: 4,
    threadWidthRatio: [0.012, 0.048],
  },
  serialNumber: {
    regions: [
      { x: 0.04, y: 0.07, width: 0.32, height: 0.11, label: "Top-left serial" },
      { x: 0.60, y: 0.80, width: 0.32, height: 0.11, label: "Bottom-right serial" },
    ],
    formatPattern: "^[0-9][A-Z]{2}\\s?[0-9]{6}$",
    characterCount: 9,
    validPrefixChars: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  uvFeatures: {
    zones: [
      { x: 0.08, y: 0.24, width: 0.26, height: 0.44, label: "Denomination numeral" },
      { x: 0.66, y: 0.14, width: 0.24, height: 0.35, label: "Ashoka Pillar / RBI seal" },
      { x: 0.05, y: 0.05, width: 0.90, height: 0.90, label: "Full-note fiber zone" },
    ],
    expectedBlueDominanceRange: [0.33, 0.56],
    fiberDensityRange: [0.001, 0.020],
  },
};

/* ────────────────────────────────────────────────────────────────────── */

const INR_200: DenominationProfile = {
  denomination: 200,
  name: "₹200",
  aspectRatio: 2.212, // 146 × 66 mm
  dominantHueRange: [35, 60],
  dominantSatRange: [0.25, 0.70],
  microprint: {
    zones: [
      { x: 0.25, y: 0.10, width: 0.14, height: 0.75, label: "Thread-adjacent band" },
      { x: 0.04, y: 0.02, width: 0.44, height: 0.07, label: "Top guarantee text" },
      { x: 0.04, y: 0.88, width: 0.44, height: 0.07, label: "Bottom denomination band" },
    ],
    expectedEdgeDensityRange: [0.08, 0.44],
    expectedFFTPeakRange: [0.05, 0.35],
  },
  securityThread: {
    region: { x: 0.30, y: 0.03, width: 0.10, height: 0.94, label: "Security thread" },
    expectedWindowCount: 5,
    threadWidthRatio: [0.012, 0.050],
  },
  serialNumber: {
    regions: [
      { x: 0.04, y: 0.07, width: 0.34, height: 0.11, label: "Top-left serial" },
      { x: 0.58, y: 0.80, width: 0.34, height: 0.11, label: "Bottom-right serial" },
    ],
    formatPattern: "^[0-9][A-Z]{2}\\s?[0-9]{6}$",
    characterCount: 9,
    validPrefixChars: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  uvFeatures: {
    zones: [
      { x: 0.08, y: 0.22, width: 0.28, height: 0.46, label: "Denomination numeral" },
      { x: 0.64, y: 0.12, width: 0.26, height: 0.38, label: "Ashoka Pillar / RBI seal" },
      { x: 0.05, y: 0.05, width: 0.90, height: 0.90, label: "Full-note fiber zone" },
    ],
    expectedBlueDominanceRange: [0.30, 0.50],
    fiberDensityRange: [0.001, 0.022],
  },
};

/* ────────────────────────────────────────────────────────────────────── */

const INR_500: DenominationProfile = {
  denomination: 500,
  name: "₹500",
  aspectRatio: 2.273, // 150 × 66 mm
  dominantHueRange: [180, 260],
  dominantSatRange: [0.04, 0.28],
  microprint: {
    zones: [
      { x: 0.24, y: 0.10, width: 0.15, height: 0.78, label: "Thread-adjacent band" },
      { x: 0.04, y: 0.02, width: 0.45, height: 0.07, label: "Top guarantee text" },
      { x: 0.04, y: 0.88, width: 0.45, height: 0.07, label: "Bottom denomination band" },
    ],
    expectedEdgeDensityRange: [0.08, 0.45],
    expectedFFTPeakRange: [0.04, 0.34],
  },
  securityThread: {
    region: { x: 0.29, y: 0.03, width: 0.10, height: 0.94, label: "Security thread" },
    expectedWindowCount: 5,
    threadWidthRatio: [0.013, 0.052],
  },
  serialNumber: {
    regions: [
      { x: 0.04, y: 0.06, width: 0.34, height: 0.12, label: "Top-left serial" },
      { x: 0.58, y: 0.78, width: 0.34, height: 0.12, label: "Bottom-right serial" },
    ],
    formatPattern: "^[0-9][A-Z]{2}\\s?[0-9]{6}$",
    characterCount: 9,
    validPrefixChars: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  uvFeatures: {
    zones: [
      { x: 0.07, y: 0.20, width: 0.30, height: 0.48, label: "Denomination numeral" },
      { x: 0.62, y: 0.10, width: 0.28, height: 0.40, label: "Ashoka Pillar / RBI seal" },
      { x: 0.05, y: 0.05, width: 0.90, height: 0.90, label: "Full-note fiber zone" },
    ],
    expectedBlueDominanceRange: [0.32, 0.52],
    fiberDensityRange: [0.001, 0.022],
  },
};

/* ────────────────────────────────────────────────────────────────────── */

const INR_2000: DenominationProfile = {
  denomination: 2000,
  name: "₹2000",
  aspectRatio: 2.515, // 166 × 66 mm
  dominantHueRange: [305, 355],
  dominantSatRange: [0.15, 0.55],
  microprint: {
    zones: [
      { x: 0.22, y: 0.08, width: 0.16, height: 0.82, label: "Thread-adjacent band" },
      { x: 0.03, y: 0.02, width: 0.48, height: 0.07, label: "Top guarantee text" },
      { x: 0.03, y: 0.88, width: 0.48, height: 0.07, label: "Bottom denomination band" },
    ],
    expectedEdgeDensityRange: [0.08, 0.45],
    expectedFFTPeakRange: [0.04, 0.34],
  },
  securityThread: {
    region: { x: 0.27, y: 0.03, width: 0.11, height: 0.94, label: "Security thread" },
    expectedWindowCount: 6,
    threadWidthRatio: [0.014, 0.055],
  },
  serialNumber: {
    regions: [
      { x: 0.03, y: 0.06, width: 0.36, height: 0.12, label: "Top-left serial" },
      { x: 0.56, y: 0.78, width: 0.36, height: 0.12, label: "Bottom-right serial" },
    ],
    formatPattern: "^[0-9][A-Z]{2}\\s?[0-9]{6}$",
    characterCount: 9,
    validPrefixChars: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  },
  uvFeatures: {
    zones: [
      { x: 0.06, y: 0.18, width: 0.32, height: 0.52, label: "Denomination numeral" },
      { x: 0.60, y: 0.08, width: 0.30, height: 0.42, label: "Ashoka Pillar / RBI seal" },
      { x: 0.05, y: 0.05, width: 0.90, height: 0.90, label: "Full-note fiber zone" },
    ],
    expectedBlueDominanceRange: [0.30, 0.50],
    fiberDensityRange: [0.001, 0.024],
  },
};

/* ────────────────────────────────────────────────────────────────────── */

export const DENOMINATION_PROFILES: DenominationProfile[] = [
  INR_10,
  INR_20,
  INR_50,
  INR_100,
  INR_200,
  INR_500,
  INR_2000,
];
