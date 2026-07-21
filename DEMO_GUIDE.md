# RUBIX Demo Guide - Step-by-Step Video Script

---

## Setup Before Recording
1. Ensure dev server is running: `npm run dev` (access at http://localhost:3000)
2. Have your phone ready (for WebRTC live call demo)
3. Prepare test files:
   - A short audio clip (for Deepfake Analyzer)
   - A photo of a banknote (for Counterfeit Scanner)
   - A sample phishing text (e.g.: "Your SBI account has been suspended! Click here https://bit.ly/fake-sbi to verify KYC immediately or lose all your money!")
4. Close other tabs/apps to keep recording clean

---

## Demo Structure (Total ~10-15 minutes)

### Part 1: Introduction & Dashboard Overview (~1 min)
**Action**: Open RUBIX homepage at http://localhost:3000
**Talking Points**:
- "Hey everyone, this is RUBIX, our Digital Public Safety Command Center!"
- "Today I'm going to walk you through all of our core features designed to combat modern digital fraud, scams, and counterfeiting."
- "First, let's take a look at our dashboard hub, which gives you access to all our modules in one place with a sleek, cyberpunk-inspired dark theme."

---

### Part 2: Live Call Shield (VoiceShield) (~2.5 mins)
**Action**: Click on "Live Call Shield" module

**Talking Points**:
- "First up is Live Call Shield—this is our real-time audio interception and scam detection feature!"
- "We have two modes: Browser Microphone and Remote Call via WebRTC."

#### 2a: Browser Microphone Demo (~1 min)
**Action**:
1. Click "Browser Mic" source
2. Click the big circular button to start listening
3. Speak a sample scam line: "This is the Delhi Police! We have an arrest warrant for you! Don't hang up and don't tell anyone—transfer ₹25,000 to this account immediately!"
4. Wait for the threat analysis to appear

**Talking Points**:
- "Okay, let's start with Browser Mic mode. As I speak this scam script..."
- "Perfect! Look at that—our AI has already detected multiple scam vectors: authority (pretending to be police), urgency (arrest warrant), isolation (don't tell anyone), and financial (send money)!"
- "Threat level is high, verdict shows Critical, and we can generate an NCRB complaint report if needed."

#### 2b: WebRTC Remote Call Demo (~1.5 mins)
**Action**:
1. Stop browser mic, switch to "Remote Call" source
2. Click "Start Remote Bridge"
3. Copy the link from the yellow alert box (or manually enter `http://[your-local-ip]:3000/phone?room=[room-id]` on your phone)
4. On your phone, open the link, tap "Start"
5. Back on the dashboard, wait for "Live Call Intercepted" status
6. On your phone, speak a scam line: "Your SBI account is locked—verify your Aadhaar and debit card right now!"
7. Wait for transcript and analysis on the dashboard
8. Tap "End Call" on phone

**Talking Points**:
- "Now let's try the Remote Call WebRTC mode, which lets you intercept audio from another device, like a victim's phone."
- "Okay, I've started a bridge, and I'll connect from my phone using this room link..."
- "And we're connected! Now as I speak this scam line on my phone, the dashboard is transcribing it in real time..."
- "Great—again our AI is flagging the threat immediately!"
- "Notice that the victim (phone side) doesn't see any transcription—only the dashboard operator does!"

---

### Part 3: Counterfeit Scanner (~1.5 mins)
**Action**:
1. Go back to dashboard, click "Counterfeit Scanner"
2. Wait for camera access, show a banknote to the camera
3. Click "Auto Capture" or capture manually with "Capture Camera Frame"
4. Or upload your test banknote photo
5. Click "Screen Image" to see the result

**Talking Points**:
- "Next up is Counterfeit Scanner! Our computer vision feature to detect fake currency notes."
- "We support both live camera feed with auto-capture, or you can upload images directly."
- "Okay, let's screen this note. While this demo uses our sample model, in production this would connect to our trained computer vision service."
- "Important note: All our results are marked as non-conclusive and require review by trained personnel for legal validity."

---

### Part 4: Phishing Disassembler (~2 mins)
**Action**:
1. Go back, click "Phishing Disassembler"
2. Paste your sample phishing text into the box
3. Click "Analyze Payload"
4. Toggle the "Fraud Network Map" if it appears
5. Click "Generate Report" if you want (optional)

**Talking Points**:
- "Phishing Disassembler is our tool for analyzing suspicious SMS, emails, or messaging payloads!"
- "Okay, let's paste this fake SBI phishing text I prepared earlier..."
- "Boom! Look—we've highlighted the psychological triggers, extracted the suspicious URL, and pulled domain intelligence!"
- "Risk score is high, verdict: Critical Threat! We can also view the fraud network map showing connections between the URL and known malicious infrastructure."
- "And just like all our modules, you can generate a court-admissible incident report with one click!"

---

### Part 5: Deepfake Analyzer (~1.5 mins)
**Action**:
1. Go back, click "Deepfake Analyzer"
2. Either record a short audio clip using your microphone, or upload your test audio file
3. Click "Run Deepfake Analysis"
4. Watch the frequency visualizer as audio plays
5. Review the transcript and AI analysis

**Talking Points**:
- "Next is Deepfake Analyzer! This checks audio for signs of AI generation or tampering!"
- "You can record directly in the browser or upload existing files like phone call recordings."
- "Okay, let's run the analysis! First Whisper transcribes the audio, then Aurigin screens for deepfake artifacts, and finally our LLM assesses if the content is scam-related!"
- "Again—remember: authenticity screening results are not conclusive proof, just a signal for further investigation."

---

### Part 6: Geospatial Mapper (~2 mins)
**Action**:
1. Go back, click "Geospatial Mapper"
2. Interact with the map: zoom in/out, click on a hotspot marker
3. Toggle "Heatmap On" to see density overlay
4. Click "Patrol Prioritization" and "Hotspot Timeline" tabs below the map
5. Check out the Statistics panel and Inter-District Sharing on the right
6. Click "Copy District Bulletin" if you want

**Talking Points**:
- "Geospatial Mapper is our law enforcement-focused tool for mapping cybercrime hotspots!"
- "Currently we're showing historical NCRB datasets, since live NCRP data isn't publicly available—but our system is ready to plug into official APIs as soon as authorized."
- "We've got heatmap overlays, patrol prioritization scoring, hotspot timelines, district-wise stats, and one-click district bulletin sharing!"
- "This helps police forces allocate patrols and resources where they're needed most!"

---

### Part 7: Incident Data Visualization (~1 min)
**Action**:
1. Go back, click "Incident Data Visualization"
2. Toggle through different chart types using the buttons at the top: Line Chart, Bar Chart, Network Graph, Sankey Flow, etc.
3. Use the filters (if available) to adjust the data shown

**Talking Points**:
- "Incident Data Visualizer gives you multiple ways to explore historical cyber incident data!"
- "Line charts for trends over time, bar charts for category comparisons, network graphs for connections—you name it!"
- "All the charts are interactive and use our signature neon theme for readability in control room environments."

---

### Part 8: Fraud Network Intelligence (~1 min)
**Action**:
1. Go back, click "Fraud Network Intelligence"
2. Interact with the force-directed graph (drag nodes around, zoom in/out)

**Talking Points**:
- "Fraud Network Intelligence maps relationships between suspicious accounts, money mules, and scam operators!"
- "This uses graph theory and network analysis to find patterns humans might miss—like clusters of transactions linked to known scams!"

---

### Part 9: Reporting Guide & Wrap Up (~1 min)
**Action**:
1. Go back, click "Official Reporting Guide" (or just mention it)
2. Close with summary

**Talking Points**:
- "And finally, our Official Reporting Guide walks users through how to file official complaints with NCRB and other authorities!"
- "Okay, that wraps up our demo of RUBIX! Thank you for watching!"
- "We're proud to be building a comprehensive, AI-powered platform to help protect people from digital fraud and scams!"

---

## Bonus Tips for Recording
- Use screen recording software (OBS, QuickTime, etc.)
- Record your voice separately for better audio quality if needed
- Do a quick practice run before hitting record
- Keep your desktop clean (hide unnecessary icons/files)
- Use good lighting for your camera if you're showing your face
