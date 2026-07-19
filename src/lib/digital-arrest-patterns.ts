/** Curated digital-arrest intelligence used by Pattern Lab and Live Call Shield. */

export type PatternCategory =
  | "scam_patterns"
  | "call_flows"
  | "spoof_signatures"
  | "script_templates";

export interface ScamPattern {
  id: string;
  title: string;
  category: PatternCategory;
  severity: "high" | "critical";
  summary: string;
  signals: string[];
  keywords: string[];
  victimAdvice: string;
}

export interface CallFlowStep {
  step: number;
  actor: "scammer" | "victim" | "mule";
  action: string;
  redFlag: string;
}

export interface CallFlow {
  id: string;
  title: string;
  durationHint: string;
  summary: string;
  stages: CallFlowStep[];
  keywords: string[];
}

export interface SpoofSignature {
  id: string;
  title: string;
  channel: "CLI" | "WhatsApp" | "Video" | "SMS";
  signature: string;
  howToSpot: string;
  keywords: string[];
}

export interface ScriptTemplate {
  id: string;
  title: string;
  persona: string;
  sampleLines: string[];
  keywords: string[];
  counterScript: string;
}

export const SCAM_PATTERNS: ScamPattern[] = [
  {
    id: "pat-cbi-parcel",
    title: "CBI / Customs parcel trap",
    category: "scam_patterns",
    severity: "critical",
    summary: "Caller claims a parcel holds illegal goods linked to the victim’s ID and demands a ‘security deposit’ to avoid arrest.",
    signals: [
      "Claims to be CBI, ED, Customs, or Cyber Cell",
      "Mentions passport / Aadhaar found with drugs or fake notes",
      "Threatens immediate arrest warrant",
      "Demands payment via crypto, gift cards, or mule account",
    ],
    keywords: ["cbi", "customs", "parcel", "drugs", "warrant", "security deposit", "cyber cell", "ed"],
    victimAdvice: "Hang up. Do not transfer money. Official agencies never demand deposits over phone/video calls.",
  },
  {
    id: "pat-digital-arrest",
    title: "Digital arrest lockdown",
    category: "scam_patterns",
    severity: "critical",
    summary: "Victim is ordered to stay on a continuous video call, keep cameras on, and not speak to family while ‘investigation’ runs.",
    signals: [
      "Stay on video call for hours",
      "Do not disconnect / do not tell anyone",
      "Show surroundings / keep face on camera",
      "Bank staff or ‘court’ joined into the same call",
    ],
    keywords: ["do not disconnect", "video call", "digital arrest", "keep camera", "don't tell", "do not tell", "isolation"],
    victimAdvice: "End the call immediately. Contact family offline. Report on 1930 / cybercrime.gov.in.",
  },
  {
    id: "pat-kyc-freeze",
    title: "Account freeze + KYC rush",
    category: "scam_patterns",
    severity: "high",
    summary: "Impersonates bank/RBI and pushes urgent KYC or ‘safe account’ transfer before funds are ‘seized’.",
    signals: [
      "Account will be frozen in X hours",
      "Share OTP / CVV / netbanking",
      "Move money to ‘safe nodal account’",
      "Fake RBI / bank escalation desk",
    ],
    keywords: ["kyc", "account frozen", "otp", "rbi", "safe account", "nodal", "verify now"],
    victimAdvice: "Banks never ask for OTP or to move money to a ‘safe account’. Call the bank using the number on your card.",
  },
  {
    id: "pat-tax-refund",
    title: "Income-tax / refund lure",
    category: "scam_patterns",
    severity: "high",
    summary: "Offers a tax refund then pivots to fee payment or remote-access software.",
    signals: ["Large refund claim", "Install AnyDesk/TeamViewer", "Pay processing fee first"],
    keywords: ["income tax", "refund", "anydesk", "teamviewer", "processing fee", "it department"],
    victimAdvice: "Do not install remote tools or pay fees for refunds. Use only official tax portals.",
  },
];

export const CALL_FLOWS: CallFlow[] = [
  {
    id: "flow-classic-arrest",
    title: "Classic digital-arrest call flow",
    durationHint: "45–180 minutes",
    summary: "Multi-stage sequence from courier bait → LEA intimidation → isolation → financial extraction.",
    keywords: ["courier", "fedex", "dhl", "cbi", "arrest", "deposit", "video"],
    stages: [
      { step: 1, actor: "scammer", action: "Courier/customs agent calls about a seized parcel", redFlag: "Unexpected parcel tied to your ID" },
      { step: 2, actor: "scammer", action: "‘Transfers’ call to fake police / CBI officer", redFlag: "Cold handoff with no verifiable badge process" },
      { step: 3, actor: "scammer", action: "Threatens arrest; forces continuous video call", redFlag: "Isolation + camera lockdown" },
      { step: 4, actor: "victim", action: "Told not to inform family or hang up", redFlag: "Social isolation tactic" },
      { step: 5, actor: "scammer", action: "Demands security deposit / crypto / mule transfer", redFlag: "Money extraction before ‘clearance’" },
      { step: 6, actor: "mule", action: "Funds moved through layering accounts", redFlag: "Rapid onward transfers" },
    ],
  },
  {
    id: "flow-bank-bridge",
    title: "Bank-bridge extraction flow",
    durationHint: "20–60 minutes",
    summary: "Fake cyber cell + fake bank relationship manager co-appear to force ‘safe account’ transfer.",
    keywords: ["bank", "relationship manager", "safe account", "freeze", "otp"],
    stages: [
      { step: 1, actor: "scammer", action: "Cyber cell claims mule activity on victim account", redFlag: "Unsolicited LEA contact" },
      { step: 2, actor: "scammer", action: "Conference-in ‘bank officer’", redFlag: "Unverifiable third party on same call" },
      { step: 3, actor: "scammer", action: "Instructs OTP sharing or app screen share", redFlag: "Credential harvest" },
      { step: 4, actor: "scammer", action: "Orders transfer to nodal/safe account", redFlag: "Financial extraction" },
    ],
  },
];

export const SPOOF_SIGNATURES: SpoofSignature[] = [
  {
    id: "spoof-local-cli",
    title: "Local CLI spoofing",
    channel: "CLI",
    signature: "Caller ID shows a nearby/police/bank number while the voice originates from a call-center VoIP route.",
    howToSpot: "Call back using an official published number from a different phone. Spoofed CLI often fails reverse verification.",
    keywords: ["caller id", "spoof", "police number", "official number", "missed call"],
  },
  {
    id: "spoof-whatsapp-business",
    title: "Fake verified business persona",
    channel: "WhatsApp",
    signature: "Display name mimics ‘Cyber Crime Helpline’ or bank support; profile photo uses badge imagery; chat pushes video link.",
    howToSpot: "Official agencies do not run arrest processes over WhatsApp video. Check the exact number against published helplines.",
    keywords: ["whatsapp", "verified", "helpline", "video link", "cyber crime"],
  },
  {
    id: "spoof-video-room",
    title: "Persistent video-room control",
    channel: "Video",
    signature: "Long Skype/Truecaller/Meet session with multiple ‘officers’ joining; background shows fake seals/uniforms.",
    howToSpot: "Ask for a written summons delivered physically. End call and verify independently.",
    keywords: ["skype", "video call", "uniform", "join the meeting", "do not leave"],
  },
  {
    id: "spoof-sms-bridge",
    title: "SMS + voice bridge",
    channel: "SMS",
    signature: "SMS with case ID arrives seconds before/after the call to reinforce legitimacy.",
    howToSpot: "Case IDs in SMS are trivial to fabricate. Never treat SMS as proof of investigation.",
    keywords: ["case id", "fir", "sms", "reference number", "acknowledge"],
  },
];

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: "script-opening",
    title: "Opening intimidation script",
    persona: "Fake Inspector / Customs",
    sampleLines: [
      "This is Inspector Sharma from CBI Cyber Cell. Do not disconnect this call.",
      "A parcel with narcotics was seized under your Aadhaar / passport details.",
      "An arrest warrant is ready. Cooperate now or we will send a local team.",
    ],
    keywords: ["inspector", "cbi", "do not disconnect", "narcotics", "arrest warrant", "aadhaar", "passport"],
    counterScript: "I will verify with official channels and call you back on a published number. Goodbye.",
  },
  {
    id: "script-isolation",
    title: "Isolation reinforcement script",
    persona: "Fake senior officer",
    sampleLines: [
      "Do not tell your family — this is a confidential national security matter.",
      "Keep your camera on. Show the room. Do not leave the frame.",
      "If you disconnect, it will be treated as non-cooperation.",
    ],
    keywords: ["do not tell", "confidential", "camera on", "do not leave", "non-cooperation", "national security"],
    counterScript: "Legitimate investigations do not forbid contacting family or require unpaid video detention.",
  },
  {
    id: "script-payment",
    title: "Payment extraction script",
    persona: "Fake recovery / compliance desk",
    sampleLines: [
      "Pay a refundable security deposit to the government nodal account.",
      "Use crypto / gift cards / UPI to this number for immediate clearance.",
      "Share the OTP you just received so we can verify the transfer.",
    ],
    keywords: ["security deposit", "nodal account", "crypto", "gift card", "share otp", "refundable", "clearance"],
    counterScript: "I will not transfer money or share OTP. I am reporting this number to 1930.",
  },
];

export interface PatternHit {
  id: string;
  layer: PatternCategory;
  title: string;
  score: number;
  matchedKeywords: string[];
  advice?: string;
}

export interface PatternMatchResult {
  overallScore: number;
  risk: "low" | "elevated" | "high" | "critical";
  hits: PatternHit[];
  activeFlow: CallFlow | null;
  matchedStages: number[];
  guidance: string[];
}

function uniqueMatches(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

export function matchDigitalArrestPatterns(input: string): PatternMatchResult {
  const text = input.trim();
  if (text.length < 8) {
    return {
      overallScore: 0,
      risk: "low",
      hits: [],
      activeFlow: null,
      matchedStages: [],
      guidance: ["Paste a call transcript, SMS, or script excerpt to score against the pattern library."],
    };
  }

  const hits: PatternHit[] = [];

  for (const pattern of SCAM_PATTERNS) {
    const matchedKeywords = uniqueMatches(text, pattern.keywords);
    if (!matchedKeywords.length) continue;
    const score = Math.min(100, 35 + matchedKeywords.length * 18);
    hits.push({
      id: pattern.id,
      layer: "scam_patterns",
      title: pattern.title,
      score,
      matchedKeywords,
      advice: pattern.victimAdvice,
    });
  }

  for (const spoof of SPOOF_SIGNATURES) {
    const matchedKeywords = uniqueMatches(text, spoof.keywords);
    if (!matchedKeywords.length) continue;
    hits.push({
      id: spoof.id,
      layer: "spoof_signatures",
      title: spoof.title,
      score: Math.min(100, 30 + matchedKeywords.length * 20),
      matchedKeywords,
      advice: spoof.howToSpot,
    });
  }

  for (const script of SCRIPT_TEMPLATES) {
    const matchedKeywords = uniqueMatches(text, script.keywords);
    if (!matchedKeywords.length) continue;
    hits.push({
      id: script.id,
      layer: "script_templates",
      title: script.title,
      score: Math.min(100, 40 + matchedKeywords.length * 15),
      matchedKeywords,
      advice: script.counterScript,
    });
  }

  let activeFlow: CallFlow | null = null;
  let matchedStages: number[] = [];
  let bestFlowScore = 0;

  for (const flow of CALL_FLOWS) {
    const flowKeywordHits = uniqueMatches(text, flow.keywords);
    const stages = flow.stages
      .filter((stage) => {
        const hay = `${stage.action} ${stage.redFlag}`.toLowerCase();
        return flowKeywordHits.some((keyword) => hay.includes(keyword.toLowerCase()) || text.toLowerCase().includes(keyword.toLowerCase()));
      })
      .map((stage) => stage.step);

    // Also mark stages when related scam language appears
    const stageHits = flow.stages
      .filter((stage) => {
        const tokens = `${stage.action} ${stage.redFlag}`.toLowerCase().split(/\W+/).filter((t) => t.length > 4);
        return tokens.some((token) => text.toLowerCase().includes(token));
      })
      .map((stage) => stage.step);

    const combinedStages = [...new Set([...stages, ...stageHits])].sort((a, b) => a - b);
    const score = flowKeywordHits.length * 12 + combinedStages.length * 14;
    if (score > bestFlowScore && (flowKeywordHits.length > 0 || combinedStages.length >= 2)) {
      bestFlowScore = score;
      activeFlow = flow;
      matchedStages = combinedStages;
      hits.push({
        id: flow.id,
        layer: "call_flows",
        title: flow.title,
        score: Math.min(100, score),
        matchedKeywords: flowKeywordHits,
        advice: "Scam call flows escalate toward payment. Interrupt before the extraction stage.",
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  const top = hits.slice(0, 6);
  const overallScore = top.length
    ? Math.min(100, Math.round(top.reduce((sum, hit) => sum + hit.score, 0) / top.length + top.length * 4))
    : 0;

  const risk: PatternMatchResult["risk"] =
    overallScore >= 80 ? "critical" : overallScore >= 60 ? "high" : overallScore >= 35 ? "elevated" : "low";

  const guidance = [
    ...new Set(
      [
        ...top.map((hit) => hit.advice).filter(Boolean),
        overallScore >= 60
          ? "Do not transfer money, share OTP, install remote apps, or click unknown links."
          : null,
        overallScore >= 60 ? "Hang up and verify using official published numbers only." : null,
        overallScore >= 80 ? "Report immediately via 1930 and cybercrime.gov.in." : null,
      ].filter((item): item is string => Boolean(item)),
    ),
  ];

  return { overallScore, risk, hits: top, activeFlow, matchedStages, guidance };
}

export const PATTERN_LIBRARY_STATS = {
  scamPatterns: SCAM_PATTERNS.length,
  callFlows: CALL_FLOWS.length,
  spoofSignatures: SPOOF_SIGNATURES.length,
  scriptTemplates: SCRIPT_TEMPLATES.length,
};
