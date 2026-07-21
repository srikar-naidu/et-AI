# RUBIX - Digital Public Safety Platform

RUBIX is an AI-powered Digital Public Safety Intelligence platform built to equip law enforcement agencies, financial institutions, and citizens with proactive tools to detect, disrupt, and respond to digital fraud networks, counterfeit currency circulation, and organized scam operations.

## Architecture

The platform is a Next.js 16 (React 19) application utilizing a modular client-heavy architecture, with intelligence services powered by the Groq LLaMA 3.3 70B model, Aurigin AI, and custom machine learning modules. Database and Authentication are handled by Supabase.

```mermaid
graph TD
    subgraph "Frontend (Next.js / React 19)"
        UI[Dashboard Hub]
        VS[Live Voice Shield & Pattern Lab]
        FN[Fraud Network Graph]
        GM[Geospatial Intelligence Map]
        PD[Phishing Disassembler]
        DA[Deepfake Audio Analyzer]
        CS[Counterfeit Currency Scanner]
        CW[Citizen Fraud Shield Chatbot]
        IDV[Incident Data Visualizer]
    end

    subgraph "Backend (Next.js App Router)"
        API_A[/api/analyze]
        API_C[/api/chat]
        API_G[/api/graph]
        API_F[/api/counterfeit]
        API_D[/api/deepfake]
        API_P[/api/phishing]
        API_H[/api/hotspots]
        API_E[/api/export-pdf]
    end

    subgraph "External AI Services"
        Groq[Groq LLaMA 3.3 70B]
        Whisper[Groq Whisper Speech-to-Text]
        Aurigin[Aurigin AI Audio Screening]
    end

    subgraph "Data Persistence & Storage"
        Supabase[(Supabase PostgreSQL)]
        S_Storage[(Supabase Object Storage)]
    end
    
    subgraph "Real-time Telemetry"
        WebRTC[PeerJS WebRTC Audio Stream]
        WebSpeech[Web Speech API]
    end

    UI --> VS & FN & GM & PD & DA & CS & CW & IDV
    
    VS <--> WebRTC & WebSpeech
    VS --> API_A
    CW --> API_C
    FN --> API_G & API_E
    CS --> API_F
    DA --> API_D & Whisper
    PD --> API_P
    GM --> API_H
    
    API_A --> Groq
    API_C --> Groq
    API_P --> Groq
    API_D --> Aurigin
    
    API_G <--> Supabase
    API_E <--> Supabase
    API_H <--> Supabase
```

## Key Features
- **Live Voice Shield**: Real-time WebRTC audio interception and transcription (via Web Speech API) streamed to Groq LLM for instantaneous scam vector detection (authority, urgency, isolation, financial).
- **Digital Arrest Pattern Lab**: Database of India-specific scam call flows, script templates, and spoof signatures.
- **Fraud Network Intelligence**: D3 force-directed graph with Weakly Connected Components (WCC) clustering, visualizing transaction flows across mule accounts. Includes court-admissible PDF evidence export with SHA-256 manifest hashing.
- **Citizen Fraud Shield**: Multi-lingual (12 regional Indian languages) conversational AI assistant.
- **Geospatial Hotspots**: Leaflet-based heatmap mapping crime clusters using official NCRB (National Crime Records Bureau) datasets.
- **Phishing Disassembler**: Psychological trigger analysis and domain intelligence for suspicious URLs and SMS.
- **Deepfake Analyzer**: Whisper transcription and Aurigin voice-authenticity screening.
- **Incident Data Visualization**: Multi-dimensional analytics using Recharts.

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env.local` file and add the required API keys (Groq, Supabase, Aurigin).

3. **Run the Development Server:**
   ```bash
   npm run dev
   ```

4. **Access the App:**
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## Technologies Used
- **Core:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion
- **AI/ML:** Groq (LLaMA 3.3 70B, Whisper), Aurigin AI
- **Database:** Supabase (PostgreSQL, pg_crypto, RLS)
- **Data Viz:** D3.js, react-force-graph, Recharts, Leaflet
- **Communications:** WebRTC (PeerJS), Web Speech API
