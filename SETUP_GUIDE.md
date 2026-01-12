# MindGrid Setup Guide

## 📋 Project Overview

**MindGrid** is an AI-powered learning platform that converts PDFs (textbooks, lecture notes, research papers) into interactive knowledge graphs. Instead of reading linearly, you get a visual network of concepts and their relationships, making it easier to understand how everything connects.

### Key Features:
- **PDF Upload**: Drag & drop any PDF
- **Interactive Knowledge Graphs**: Visual network of concepts with relationships
- **Deep Concept Exploration**: Click nodes for detailed insights (overview, formulas, theorems)
- **AI-Generated Study Materials**: Overviews, summaries, and audio scripts
- **Audio Study Guides**: Text-to-speech conversion for mobile studying
- **Dark/Light Themes**: Comfortable studying at any time

### How It Works:
1. **PDF → Text**: PyPDF extracts raw content
2. **Text → Concepts**: OpenRouter (Grok 4 Fast) identifies key ideas
3. **Concepts → Graph**: Google Gemini maps connections and hierarchy
4. **Graph → Materials**: Generate overviews, audio scripts, study guides
5. **Script → Audio**: ElevenLabs converts to speech

---

## 🔑 Required API Keys & Accounts

You need **4 API keys** and **1 Firebase service account** to run this project:

### 1. **Google Gemini API Key** (Required)
- **Purpose**: Deep concept analysis, relationship mapping, and concept insights
- **Used for**: 
  - Converting text to structured JSON
  - Creating hierarchical knowledge graphs
  - Generating concept insights when clicking nodes
- **How to get**:
  1. Go to [Google AI Studio](https://aistudio.google.com/)
  2. Sign in with your Google account
  3. Click "Get API Key" or go to [API Keys page](https://aistudio.google.com/app/apikey)
  4. Create a new API key
  5. Copy the key (starts with `AIza...`)
- **Cost**: Free tier available with generous limits
- **Environment Variable**: `GEMINI_API_KEY`

### 2. **OpenRouter API Key** (Required)
- **Purpose**: AI digest generation, study guides, and audio scripts
- **Used for**: 
  - Creating concept outlines from PDF text
  - Generating study guide overviews
  - Creating audio scripts
- **How to get**:
  1. Go to [OpenRouter.ai](https://openrouter.ai/)
  2. Sign up for an account
  3. Go to [Keys page](https://openrouter.ai/keys)
  4. Create a new API key
  5. Copy the key
- **Cost**: Pay-as-you-go pricing, very affordable for development
- **Environment Variable**: `OPENROUTER_API_KEY`

### 3. **ElevenLabs API Key** (Required for Audio Features)
- **Purpose**: Text-to-speech audio generation
- **Used for**: Converting audio scripts to speech
- **How to get**:
  1. Go to [ElevenLabs.io](https://www.elevenlabs.io/)
  2. Sign up for an account
  3. Go to your [Profile/API Keys](https://elevenlabs.io/app/settings/api-keys)
  4. Generate a new API key
  5. Copy the key
- **Cost**: 
  - **Free tier**: Works for localhost development only
  - **Paid tier**: $5/month minimum for production/cloud deployments
- **⚠️ Important**: Free tier is blocked on cloud deployments due to IP abuse prevention
- **Environment Variable**: `ELEVENLABS_API_KEY`

### 4. **Firebase Service Account** (Required for Project Storage)
- **Purpose**: Storing and retrieving project data (knowledge graphs, digests)
- **Used for**: 
  - Saving projects to Firestore database
  - Loading saved projects
  - Project management (list, update, delete)
- **How to get**:
  1. Go to [Firebase Console](https://console.firebase.google.com/)
  2. Create a new project (or use existing)
  3. Go to **Project Settings** → **Service Accounts**
  4. Click **Generate New Private Key**
  5. Download the JSON file (e.g., `firebase_private.json`)
  6. Save it in `backend/secrets/firebase_private.json` (create the `secrets` folder if needed)
- **Alternative**: You can also set `FIREBASE_CREDENTIALS_JSON` as an environment variable with the JSON content as a string
- **Cost**: Free tier with generous limits for development
- **Environment Variable**: `FIREBASE_SERVICE_ACCOUNT_PATH` (default: `secrets/firebase_private.json`)

---

## 📦 Prerequisites

Before setting up, ensure you have:

- **Python 3.8+** installed
- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Git** (if cloning from repository)

---

## 🚀 Setup Instructions

### Step 1: Clone/Navigate to Project

```bash
cd /Users/princypatel/Downloads/brainlattice-main
```

### Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment** (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file** in the `backend` directory:
   ```bash
   touch .env  # or create manually
   ```

5. **Add API keys to `.env` file**:
   ```bash
   # backend/.env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   FIREBASE_SERVICE_ACCOUNT_PATH=secrets/firebase_private.json
   ```

6. **Create secrets directory and add Firebase credentials**:
   ```bash
   mkdir -p secrets
   # Copy your firebase_private.json file to backend/secrets/firebase_private.json
   ```

### Step 3: Frontend Setup

1. **Navigate to frontend directory** (from project root):
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env.local` file** (optional, for custom API URL):
   ```bash
   # frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
   (This is the default, so you can skip this step if using default)

### Step 4: Run the Application

#### Terminal 1 - Backend Server:
```bash
cd backend
# Activate virtual environment if you created one
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

Backend will run on: `http://localhost:8000`

#### Terminal 2 - Frontend Server:
```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:3000`

### Step 5: Test the Application

1. Open your browser and go to `http://localhost:3000`
2. You should see the MindGrid interface
3. Try uploading a PDF (textbook, lecture notes, etc.)
4. Watch it process and generate your knowledge graph!

---

## 🔧 Troubleshooting

### Backend Issues

**Problem**: `AI services initialization failed`
- **Solution**: Check that all API keys are correctly set in `backend/.env`
- Verify the keys are valid and not expired

**Problem**: `Firebase credentials not found`
- **Solution**: 
  - Ensure `firebase_private.json` exists in `backend/secrets/`
  - Or set `FIREBASE_CREDENTIALS_JSON` environment variable with JSON content

**Problem**: `Module not found` errors
- **Solution**: 
  - Make sure you're in a virtual environment
  - Run `pip install -r requirements.txt` again

### Frontend Issues

**Problem**: Cannot connect to backend API
- **Solution**: 
  - Ensure backend is running on `http://localhost:8000`
  - Check `NEXT_PUBLIC_API_URL` in `.env.local` matches backend URL
  - Check browser console for CORS errors

**Problem**: `npm install` fails
- **Solution**: 
  - Try deleting `node_modules` and `package-lock.json`
  - Run `npm install` again
  - Or try `npm cache clean --force` then `npm install`

### API Key Issues

**Problem**: ElevenLabs audio generation fails
- **Solution**: 
  - Free tier only works on localhost
  - For production, upgrade to paid plan ($5/month)
  - Or skip audio features if not needed

**Problem**: OpenRouter API errors
- **Solution**: 
  - Check your account has credits/balance
  - Verify API key is correct
  - Check rate limits

---

## 📝 Environment Variables Summary

### Backend (`.env` file in `backend/` directory):
```bash
GEMINI_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
FIREBASE_SERVICE_ACCOUNT_PATH=secrets/firebase_private.json
# OR use JSON string:
# FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
```

### Frontend (`.env.local` file in `frontend/` directory - optional):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 🎯 Quick Start Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 18+ installed
- [ ] Google Gemini API key obtained
- [ ] OpenRouter API key obtained
- [ ] ElevenLabs API key obtained
- [ ] Firebase service account JSON file downloaded
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `.env` file created in `backend/` with all API keys
- [ ] Firebase credentials file placed in `backend/secrets/`
- [ ] Backend server running (`python main.py`)
- [ ] Frontend server running (`npm run dev`)
- [ ] Application accessible at `http://localhost:3000`

---

## 📚 Additional Resources

- **Project README**: See `README.md` for more details
- **Devpost**: [MindGrid on Devpost](https://devpost.com/software/mindgrid)
- **API Documentation**: Backend API docs available at `http://localhost:8000/docs` when running

---

## 💡 Tips

1. **Start with a small PDF** to test the pipeline
2. **Check backend logs** if processing fails
3. **Monitor API usage** on OpenRouter and ElevenLabs dashboards
4. **Firebase free tier** is generous for development
5. **Audio features** require ElevenLabs paid plan for production

---

Good luck setting up MindGrid! 🚀



made firebase optional for now, need to make it back to origin before deploying 