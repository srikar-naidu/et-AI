# RUBIX: Digital Public Safety Command Center - Comprehensive Technical Description

## 1. Executive Summary

**RUBIX** is a next-generation AI-powered digital public safety and threat detection platform designed to combat modern cybercrime, financial fraud, and social engineering attacks. It is built as a modular, real-time command center that integrates multiple cutting-edge technologies to provide law enforcement and citizens with tools to detect, analyze, and respond to digital threats.

Key features include:
- Live audio interception and AI-powered scam detection
- Computer-vision-based counterfeit currency and ID scanning
- URL, SMS, and email phishing payload analysis with network visualization
- Deepfake audio detection and transcription analysis
- Geospatial mapping of crime hotspots using historical data
- Interactive incident data visualization
- Fraud network intelligence and money mule detection
- Official NCRB-compliant reporting tools

---

## 2. Architecture Overview

### 2.1 Technology Stack

#### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 with custom neon theme
- **Animations**: Framer Motion for smooth transitions
- **Maps**: Leaflet with OpenStreetMap tiles
- **Data Visualization**: Recharts, D3.js, react-force-graph-2d, d3-chord, d3-sankey
- **Real-Time Communication**: PeerJS (WebRTC)
- **Speech Recognition**: Web Speech API

#### Backend (Next.js App Router API Routes)
- **Language**: TypeScript
- **Database & Storage**: Supabase PostgreSQL with pg_crypto and RLS, Supabase Object Storage
- **AI/ML Services**:
  - Groq: LLaMA 3.3 70B LLM for threat analysis and chat, Whisper for speech-to-text
  - Aurigin AI: Voice authenticity and deepfake screening
- **Other Integrations**: Twilio (WhatsApp/Voice), ML service for currency counterfeit detection

---

## 3. Core Modules & Features

### 3.1 Live Call Shield (VoiceShield)

**Purpose**: Real-time audio interception and AI analysis for digital arrest scams.

**Technical Capabilities**:
- Dual-mode audio input:
  - Browser Microphone: Uses Web Speech API for real-time transcription and analysis
  - WebRTC Remote Call: PeerJS-based peer-to-peer audio streaming (mobile victim connects to dashboard operator via room ID link)
- Transcript accumulation and AI threat analysis via Groq API
- Threat vector detection (authority, urgency, isolation, financial)
- Threat level visualization with animated indicators
- Auto-generated NCRB-compliant incident report generation

**Security**: WebRTC uses peer-to-peer communication with no central server storing audio; transcripts stay in browser during session.

---

### 3.2 Counterfeit Scanner

**Purpose**: Detect counterfeit currency and identification documents using computer vision.

**Technical Capabilities**:
- Live camera feed (rear-facing camera preferred on mobile)
- Auto-capture countdown feature for controlled image capture
- File upload support (JPG, PNG, etc.)
- Image pre-processing and conversion to canvas for model inference
- Visual scanning indicator animation
- Results display with confidence score
- Non-conclusive screening disclaimer for legal purposes

---

### 3.3 Phishing Disassembler

**Purpose**: Analyze suspicious SMS, email, or messaging payloads to detect phishing and fraud attempts.

**Technical Capabilities**:
- Raw text payload input
- Automatic URL extraction using regex
- Psychological trigger detection (keywords like "urgent", "suspended", "KYC", etc.)
- Domain intelligence lookup (age, location, registrar info)
- Risk scoring algorithm (0-100)
- Fraud network visualization using force-directed graph (react-force-graph-2d)
- Interactive dissected payload view with highlights on suspicious elements
- Report generation with evidence attachment

---

### 3.4 Deepfake Analyzer

**Purpose**: Detect AI-generated audio deepfakes and analyze the content context for scam indicators.

**Technical Capabilities**:
- Audio file upload support (MP3, WAV, WebM auto-converted)
- In-browser audio recording via MediaRecorder and getUserMedia
- Web Audio API-based real-time frequency visualizer
- Whisper transcription via Groq API
- Aurigin AI voice authenticity screening (requires WAV format conversion from browser WebM)
- Threat assessment of transcript content via Groq LLM
- Multi-stage analysis pipeline (transcribe → screen authenticity → analyze context)

---

### 3.5 Geospatial Mapper

**Purpose**: Visualize and analyze cybercrime hotspots to inform law enforcement patrol strategies.

**Technical Capabilities**:
- Interactive Leaflet map with OpenStreetMap base tiles
- Historical NCRB dataset hotspots (Delhi, Mumbai, Bengaluru, Kolkata, Chennai)
- Heatmap overlay option using Leaflet.heat
- Timeline view of latest reports
- Patrol prioritization scoring (based on severity, count, recency)
- District-wise summary statistics
- Deployment planning tool with statuses (monitoring, dispatching, escalated)
- Auto-refresh of live data if configured via Supabase
- District bulletin copy-to-clipboard for inter-agency sharing

---

### 3.6 Digital Arrest Pattern Lab
*(Placeholder, integrated in VoiceShield)*

**Purpose**: Analyze common scam call patterns, script templates, and number-spoofing signatures.

---

### 3.7 Fraud Network Intelligence

**Purpose**: Map relationships between fraud entities, accounts, and coordinated attack patterns.

**Technical Capabilities**:
- Force-directed graph visualization (react-force-graph-2d)
- Node/link representation of entities and connections
- Sankey flow diagrams for financial transaction flows
- Chord diagrams for group connections
- Color-coded nodes for entity types
- Integration with Supabase for network data

---

### 3.8 Incident Data Visualization

**Purpose**: Explore historical and real-time cyber incident data using multiple interactive chart types.

**Technical Capabilities**:
- Multiple visualization modes: line chart, bar chart, network graph, sankey, chord diagram, heatmap
- Data filtering by time, severity, category, location
- Custom tooltip and legend styling for dark theme
- Responsive container sizing
- Color-coded using RUBIX neon theme (cyan, green, red)

---

### 3.9 Official Reporting Guide

**Purpose**: Guide users through the process of filing official reports with law enforcement and NCRB.

---

## 4. Backend API Endpoints

### Core AI/ML Endpoints
1. `/api/analyze`: Analyzes audio transcripts to detect scam threats (uses Groq LLM)
2. `/api/chat`: General LLM chat interface
3. `/api/transcribe`: Speech-to-text transcription using Whisper (Groq)
4. `/api/deepfake`: Voice authenticity screening using Aurigin AI
5. `/api/phishing`: Phishing payload and URL analysis
6. `/api/counterfeit`: Counterfeit currency/ID computer vision screening

### Data & Storage Endpoints
7. `/api/hotspots`: Retrieves cybercrime hotspots (from Supabase or fallback dataset)
8. `/api/graph`: Fraud network graph data
9. `/api/cases`: Case CRUD operations with audit trail
10. `/api/cases/[id]/export`: Export case details to PDF
11. `/api/evidence`: Evidence file storage and retrieval via Supabase Storage
12. `/api/cyber-cases`: Cyber case data for visualization
13. `/api/complaints`: Complaint management
14. `/api/export-pdf`: General PDF export service
15. `/api/health`: Health check and service readiness status
16. `/api/seed/demo-data`: Seed demo data into Supabase
17. `/api/auth/session`: Authentication session management

### Communication Endpoints (Twilio)
18. `/api/channels/twilio/voice`: Twilio voice webhook handling
19. `/api/channels/twilio/voice/transcription`: Twilio transcription webhook
20. `/api/channels/twilio/voice/process`: Twilio voice processing
21. `/api/channels/twilio/whatsapp`: Twilio WhatsApp message handling

### Live Call Session Endpoint
22. `/api/live-call/active`: Tracks active WebRTC and Twilio call sessions

---

## 5. Database & Data Model (Supabase)

### Tables
- `live_call_sessions`: Stores active/intercepted call sessions (call_sid, caller info, transcript, status, timestamps)
- `cases`: Cybercrime cases with metadata, severity, status, linked evidence
- `evidence`: File attachments and links related to cases
- `complaints`: User-submitted complaints
- `cyber_cases`: Historical cyber incident data for visualization
- `fraud_network`: Nodes and edges for fraud network graph
- `hotspots`: Geospatial data for cybercrime hotspots (lat/lng, location, severity, count)

---

## 6. Security & Compliance

### Design Principles
1. **Privacy by Design**: No PII is stored without explicit consent; audio is processed in real-time without persistent storage unless saved as evidence.
2. **Non-Conclusive Disclaimers**: All AI/ML results marked as non-conclusive, requiring trained personnel review for legal validity.
3. **RLS (Row Level Security)**: Supabase RLS policies restrict data access based on user authentication.
4. **Encryption**: Supabase uses pg_crypto for at-rest encryption; data in transit uses HTTPS/WSS.
5. **Audit Trails**: All case modifications are logged.

---

## 7. Deployment & Infrastructure

### Local Development
1. `npm install` to install dependencies
2. Configure environment variables in `.env.local`:
   - Supabase URL and anon/service keys
   - Groq API key
   - Aurigin API key (optional)
   - Twilio credentials (optional for paid features)
3. `npm run dev` to start the development server on http://localhost:3000

### Production Deployment
Can be deployed to Vercel, Netlify, or any Node.js hosting provider. Requires:
- Environment variables configured
- Supabase database and storage properly set up
- SSL for HTTPS (required for WebRTC and media devices)

### Network Requirements
- Both devices in a WebRTC session must have internet access for peer discovery (PeerJS Cloud broker)
- No inbound ports required for peer-to-peer communication

---

## 8. Conclusion

RUBIX provides a comprehensive, modular, and modern approach to digital public safety. By integrating AI/ML, real-time communication, computer vision, and geospatial analysis into a single command center interface, it empowers both citizens and law enforcement to detect and respond to digital threats quickly and effectively.
