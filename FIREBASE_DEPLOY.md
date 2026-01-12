# Firebase Deployment Guide

## Prerequisites

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Create a Firebase Project**:
   - Go to https://console.firebase.google.com
   - Create a new project
   - Enable Firestore Database
   - Enable Cloud Functions

## Setup

### 1. Initialize Firebase Project

Replace `your-project-id` in `.firebaserc` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 2. Set Environment Variables

Firebase Functions need your API keys. Set them using:

```bash
# Google Gemini
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# OpenRouter (Grok)
firebase functions:config:set openrouter.api_key="YOUR_OPENROUTER_API_KEY"

# ElevenLabs
firebase functions:config:set elevenlabs.api_key="YOUR_ELEVENLABS_API_KEY"

# OpenAI (if used)
firebase functions:config:set openai.api_key="YOUR_OPENAI_API_KEY"
```

Or set them in the Firebase Console:
- Go to Functions → Configuration
- Add environment variables

### 3. Update Backend for Environment Variables

The backend needs to read from Firebase Functions config. Update your `backend/.env` or modify code to use:

```python
import firebase_admin
from firebase_admin import credentials

# Initialize Firebase Admin
if not firebase_admin._apps:
    firebase_admin.initialize_app()

# Access config (set via firebase functions:config:set)
# Or use environment variables directly
```

### 4. Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

## Deploy

### Option 1: Use Deploy Script (Recommended)

```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Deploy everything
firebase deploy

# Or deploy separately:
firebase deploy --only hosting    # Deploy frontend only
firebase deploy --only functions  # Deploy backend only
```

## Configuration Files

- **firebase.json**: Main Firebase configuration
  - Routes `/api/**` to Cloud Functions
  - Serves frontend from `frontend/out`

- **.firebaserc**: Project configuration
  - Update with your Firebase project ID

- **backend/main_firebase.py**: Cloud Functions entry point
  - Wraps FastAPI for Firebase

- **backend/requirements_firebase.txt**: Python dependencies
  - Includes `firebase-functions` and `firebase-admin`

## Important Notes

### Cloud Functions Limitations

1. **Cold Starts**: First request may be slow (~5-10s)
2. **Timeouts**: Max 60s for HTTP functions (540s for 2nd gen)
3. **Memory**: Default 256MB (increase if needed)
4. **Concurrency**: Default 1 (increase for better performance)

### Update Function Configuration

Edit `firebase.json` to increase limits:

```json
{
  "functions": [
    {
      "source": "backend",
      "codebase": "backend",
      "runtime": "python311",
      "memory": "512MB",
      "timeout": "60s",
      "maxInstances": 10
    }
  ]
}
```

### Frontend Environment Variables

Update `frontend/src/lib/api.ts` to use production API URL:

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Firebase handles routing
  : 'http://localhost:8000/api';
```

## Testing Locally

### Test Frontend
```bash
cd frontend
npm run dev
```

### Test Backend Locally with Firebase Emulator
```bash
firebase emulators:start
```

This starts:
- Functions emulator (localhost:5001)
- Hosting emulator (localhost:5000)
- Firestore emulator (localhost:8080)

## Deployment Commands

```bash
# Deploy everything
firebase deploy

# Deploy only hosting (frontend)
firebase deploy --only hosting

# Deploy only functions (backend)
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:api

# View deployment
firebase hosting:channel:deploy preview

# View logs
firebase functions:log
```

## Cost Estimates

Firebase has a generous free tier (Spark Plan):
- **Hosting**: 10 GB storage, 360 MB/day transfer
- **Functions**: 2M invocations/month, 400K GB-seconds
- **Firestore**: 1 GB storage, 50K reads, 20K writes/day

For production, consider **Blaze Plan** (pay-as-you-go):
- Functions: $0.40 per million invocations
- Firestore: $0.18/GB storage, $0.06 per 100K reads

## Troubleshooting

### "Function deployment failed"
- Check Python version (must be 3.11)
- Verify all dependencies in requirements_firebase.txt
- Check function logs: `firebase functions:log`

### "API calls timing out"
- Increase timeout in firebase.json
- Check backend logs for errors
- Verify API keys are set correctly

### "Firestore permission denied"
- Update Firestore security rules in Firebase Console
- Or create `firestore.rules` file

### "CORS errors"
- Already handled in main_firebase.py
- Verify firebase.json rewrites are correct

## Monitor Your App

- **Firebase Console**: https://console.firebase.google.com
- **Functions Dashboard**: Monitor invocations, errors, latency
- **Hosting Dashboard**: Traffic, bandwidth usage
- **Firestore Dashboard**: Database usage, queries

## Updating After Initial Deploy

```bash
# Make changes to code
# Then redeploy:
./deploy.sh

# Or for quick frontend updates:
cd frontend && npm run build && cd .. && firebase deploy --only hosting
```

---

**Ready to deploy?**
1. Update `.firebaserc` with your project ID
2. Set environment variables
3. Run `./deploy.sh`
