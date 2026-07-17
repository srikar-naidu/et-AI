# Getting Started: Public Safety Command Center

This guide walks you through setting up and running all integrated features locally.

## Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.8+ for ML services
- Existing Supabase project (already configured in `.env.local`)
- (Optional) Twilio account for production voice integration

## Setup Steps

### 1. Install Dependencies

```bash
# Frontend
npm install

# ML service (for counterfeit currency screening)
cd ml-service
pip install -r requirements.txt
cd ..
```

### 2. Database Setup

The Supabase schema is already created. Seed it with demo data:

```bash
# Start the Next.js dev server
npm run dev

# In another terminal, seed the database
curl -X POST http://localhost:3000/api/seed/demo-data
```

This populates:
- **Graph entities**: 5 financial accounts/organizations for the fraud network
- **Graph edges**: 4 transfer relationships showing suspicious money flow
- **Cases**: 3 sample investigation cases
- **Audit events**: Timeline entries for case tracking

Expected response:
```json
{
  "success": true,
  "message": "Demo data seeded successfully",
  "entities": 5,
  "edges": 4,
  "cases": 3
}
```

### 3. Start the Mock Counterfeit Model Service

The counterfeit currency screening needs a local ML service. A mock version is included:

```bash
cd ml-service
pip install fastapi uvicorn

# Run the mock service on port 8000
uvicorn mock_app:app --reload --port 8000
```

In another terminal, verify it's running:
```bash
curl http://localhost:8000/health
# Response: {"ready": true}
```

### 4. Start the Next.js Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Feature Integration Status

### ✅ Voice Shield (Twilio Integration)
- **Status**: Ready for testing
- **Requirements**: `.env.local` has mock Twilio credentials
- **How to test**: 
  - In production, connect a real Twilio number
  - Voice calls will be processed via `/api/channels/twilio/voice`
  - Call transcripts are analyzed for scam indicators using Groq AI
  - Suspicious patterns trigger alerts

### ✅ Counterfeit Scanner
- **Status**: Ready
- **Requirements**: Mock ML service running on `http://localhost:8000`
- **How to test**:
  1. Go to "Counterfeit Scanner" tab
  2. Capture or upload a currency image
  3. Click "Screen Image"
  4. Results will show `VERIFIED` or `COUNTERFEIT` with confidence

### ✅ Fraud Network Intelligence
- **Status**: Ready
- **Requirements**: Supabase configured + demo data seeded
- **What you'll see**:
  - 5 financial entities displayed as nodes
  - 4 transfer relationships shown as edges
  - High-risk entities highlighted in red
  - Flagged transfers marked with thick red lines
  - Real-time clustering analysis

### ✅ Case & Evidence Management
- **Status**: Ready
- **Requirements**: Supabase configured + demo data seeded
- **Features**:
  - 3 sample cases pre-loaded
  - Click a case to view its audit timeline
  - Upload evidence files (SHA-256 integrity hashing)
  - Export case bundle as JSON
  - All evidence stored securely in Supabase

## Environment Variables Reference

Currently configured in `.env.local`:

```
GROQ_API_KEY=gsk_hcOQSu9b...        # AI analysis (already set)
NEXT_PUBLIC_SUPABASE_URL=https://...# Supabase (already set)
SUPABASE_SECRET_KEY=sb_secret_...   # Server key (already set)
COUNTERFEIT_MODEL_API_URL=http://localhost:8000  # Local mock service
TWILIO_ACCOUNT_SID=ACc1fb...        # Mock for local testing
TWILIO_AUTH_TOKEN=mock_auth_...     # Mock for local testing
APP_BASE_URL=http://localhost:3000  # Local development
```

## Troubleshooting

### "Currency-screening model is not deployed yet"
- Ensure the mock service is running: `uvicorn mock_app:app --reload --port 8000`
- Verify `COUNTERFEIT_MODEL_API_URL=http://localhost:8000` in `.env.local`

### "Could not load the investigation graph"
- Check Supabase connection: `NEXT_PUBLIC_SUPABASE_URL` and keys
- Seed demo data: `curl -X POST http://localhost:3000/api/seed/demo-data`
- Verify graph_entities table has data in Supabase dashboard

### "Could not load cases"
- Same as above - ensure Supabase is connected and demo data is seeded

### Voice Shield not working
- For local testing, Twilio mock credentials are fine
- For production: Get real credentials from https://console.twilio.com
- Update `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`

## Production Deployment

### Voice Shield (Twilio)
1. Create account at https://console.twilio.com
2. Get Account SID and Auth Token
3. Set up a phone number or WhatsApp sandbox
4. Update `.env.local` with real credentials
5. Set `TWILIO_VALIDATE_SIGNATURE=true`

### Counterfeit Model Service
1. Train the model: See `ml-service/README.md`
2. Deploy to Render, AWS, or similar
3. Set `COUNTERFEIT_MODEL_API_URL` to deployed service URL

### Supabase
- Already configured at https://dabvgemgflsyuuurtopi.supabase.co
- Enable Row-Level Security policies as needed
- Rotate secret keys periodically

## Health Check

Test all integrations at `/api/health`:

```bash
curl http://localhost:3000/api/health
```

Response shows status of:
- Groq AI (voice analysis)
- Supabase (graph & cases)
- Counterfeit model service
- Aurigin (deepfake detection, if configured)
- Twilio (voice channel)

## Next Steps

1. ✅ Start the mock ML service
2. ✅ Seed demo data
3. ✅ Test each feature
4. 🔄 Connect real Twilio credentials for production
5. 🔄 Train and deploy counterfeit model
6. 🔄 Configure proper authentication

Questions? Check the component implementations in `src/components/` and API routes in `src/app/api/`.
