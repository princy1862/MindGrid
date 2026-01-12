# MindGrid - Complete Command Guide

## 📋 Table of Contents
1. [What is Docker Used For?](#what-is-docker-used-for)
2. [Initial Setup](#initial-setup)
3. [Local Development (Without Docker)](#local-development-without-docker)
4. [Docker Setup & Running](#docker-setup--running)
5. [Deployment Commands](#deployment-commands)
6. [Running the Complete Project](#running-the-complete-project)

---

## What is Docker Used For?

**Docker** in this project is used for:
- **Containerization**: Packages the backend application with all its dependencies
- **Deployment**: Deploys to Google Cloud Platform (GCP) Cloud Run
- **Consistency**: Ensures the app runs the same way in development and production
- **Isolation**: Keeps dependencies separate from your system

The Dockerfile creates a container with:
- Python 3.11
- All Python dependencies
- The FastAPI application
- Configured for Cloud Run (uses PORT environment variable)

---

## Initial Setup

### 1. Navigate to Project Directory
```bash
cd /Users/princypatel/Downloads/brainlattice-main
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
cd backend
python3 -m venv venv
```

#### Activate Virtual Environment
```bash
# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

#### Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### Create .env File
```bash
# Create .env file in backend directory
cat > .env << 'EOF'
# MindGrid Backend Environment Variables
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
FIREBASE_SERVICE_ACCOUNT_PATH=secrets/firebase_private.json
EOF
```

#### Create Secrets Directory and Add Firebase Credentials
```bash
mkdir -p secrets
# Copy your firebase_private.json file to backend/secrets/firebase_private.json
# Or download from Firebase Console → Project Settings → Service Accounts
```

### 3. Frontend Setup

#### Navigate to Frontend
```bash
cd ../frontend
```

#### Install Node Dependencies
```bash
npm install
```

#### Create .env.local (Optional - for custom API URL)
```bash
# Only needed if backend runs on different port/URL
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api
EOF
```

---

## Local Development (Without Docker)

### Terminal 1: Backend Server
```bash
cd backend
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# Run the backend
python main.py
```

**Backend will run on:** `http://localhost:8000`

### Terminal 2: Frontend Server
```bash
cd frontend
npm run dev
```

**Frontend will run on:** `http://localhost:3000`

### Access the Application
- Open browser: `http://localhost:3000`
- Backend API docs: `http://localhost:8000/docs`

---

## Docker Setup & Running

### Prerequisites
```bash
# Check if Docker is installed
docker --version

# If not installed, install Docker Desktop:
# macOS: https://www.docker.com/products/docker-desktop
# Linux: https://docs.docker.com/engine/install/
```

### Build Docker Image

#### Navigate to Backend Directory
```bash
cd backend
```

#### Build the Docker Image
```bash
# Build with tag 'mindgrid-backend'
docker build -t mindgrid-backend .

# Or build with version tag
docker build -t mindgrid-backend:latest .
```

#### Verify Image was Created
```bash
docker images | grep mindgrid-backend
```

### Run Docker Container Locally

#### Run with Environment Variables
```bash
docker run -d \
  --name mindgrid-backend \
  -p 8080:8080 \
  -e GEMINI_API_KEY=your_gemini_api_key \
  -e OPENROUTER_API_KEY=your_openrouter_api_key \
  -e ELEVENLABS_API_KEY=your_elevenlabs_api_key \
  -e FIREBASE_SERVICE_ACCOUNT_PATH=secrets/firebase_private.json \
  -v $(pwd)/secrets:/app/secrets:ro \
  mindgrid-backend
```

#### Run with .env File
```bash
# Create a .env file first, then:
docker run -d \
  --name mindgrid-backend \
  -p 8080:8080 \
  --env-file .env \
  -v $(pwd)/secrets:/app/secrets:ro \
  mindgrid-backend
```

#### Run with Firebase Credentials as Environment Variable
```bash
# If using FIREBASE_CREDENTIALS_JSON instead of file
docker run -d \
  --name mindgrid-backend \
  -p 8080:8080 \
  -e GEMINI_API_KEY=your_key \
  -e OPENROUTER_API_KEY=your_key \
  -e ELEVENLABS_API_KEY=your_key \
  -e FIREBASE_CREDENTIALS_JSON='{"type":"service_account",...}' \
  mindgrid-backend
```

### Docker Container Management

#### View Running Containers
```bash
docker ps
```

#### View All Containers (including stopped)
```bash
docker ps -a
```

#### View Container Logs
```bash
docker logs mindgrid-backend

# Follow logs in real-time
docker logs -f mindgrid-backend
```

#### Stop Container
```bash
docker stop mindgrid-backend
```

#### Start Stopped Container
```bash
docker start mindgrid-backend
```

#### Restart Container
```bash
docker restart mindgrid-backend
```

#### Remove Container
```bash
docker rm mindgrid-backend
```

#### Remove Container (Force, if running)
```bash
docker rm -f mindgrid-backend
```

#### Remove Docker Image
```bash
docker rmi mindgrid-backend
```

### Test Docker Container
```bash
# Health check
curl http://localhost:8080/health

# API root
curl http://localhost:8080/
```

---

## Deployment Commands

### Google Cloud Platform (GCP) Deployment

#### Prerequisites
```bash
# Install Google Cloud SDK
# macOS
brew install --cask google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install

# Login to GCP
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Build and Push to Google Container Registry (GCR)

```bash
cd backend

# Set your GCP project ID
export PROJECT_ID=your-gcp-project-id
export REGION=us-central1  # or your preferred region

# Build and push to GCR
gcloud builds submit --tag gcr.io/$PROJECT_ID/mindgrid-backend

# Or use Artifact Registry (newer, recommended)
gcloud artifacts repositories create mindgrid-repo \
  --repository-format=docker \
  --location=$REGION

gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/mindgrid-repo/mindgrid-backend
```

#### Deploy to Cloud Run

```bash
# Deploy with environment variables
gcloud run deploy mindgrid-backend \
  --image gcr.io/$PROJECT_ID/mindgrid-backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your_key,OPENROUTER_API_KEY=your_key,ELEVENLABS_API_KEY=your_key" \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT=secrets/firebase_private.json:latest"

# Or deploy with secrets from Secret Manager
gcloud run deploy mindgrid-backend \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/mindgrid-repo/mindgrid-backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your_key,OPENROUTER_API_KEY=your_key,ELEVENLABS_API_KEY=your_key" \
  --set-secrets="FIREBASE_CREDENTIALS_JSON=firebase-credentials:latest"
```

#### Update Environment Variables After Deployment
```bash
gcloud run services update mindgrid-backend \
  --region $REGION \
  --update-env-vars="GEMINI_API_KEY=new_key"
```

#### View Deployment URL
```bash
gcloud run services describe mindgrid-backend \
  --region $REGION \
  --format 'value(status.url)'
```

#### View Deployment Logs
```bash
gcloud run services logs read mindgrid-backend \
  --region $REGION
```

### Frontend Deployment (Vercel)

#### Prerequisites
```bash
# Install Vercel CLI
npm install -g vercel
```

#### Deploy to Vercel
```bash
cd frontend

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Deploy to production
vercel --prod

# Set environment variables in Vercel dashboard or:
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-cloud-run-url.run.app/api
```

#### Update Frontend Environment Variables
```bash
# In Vercel Dashboard: Project → Settings → Environment Variables
# Or via CLI:
vercel env add NEXT_PUBLIC_API_URL production
```

---

## Running the Complete Project

### Option 1: Local Development (Recommended for Development)

#### Terminal 1: Backend
```bash
cd backend
source venv/bin/activate
python main.py
```

#### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

**Access:** `http://localhost:3000`

---

### Option 2: Docker Backend + Local Frontend

#### Terminal 1: Docker Backend
```bash
cd backend
docker build -t mindgrid-backend .
docker run -d \
  --name mindgrid-backend \
  -p 8080:8080 \
  --env-file .env \
  -v $(pwd)/secrets:/app/secrets:ro \
  mindgrid-backend
```

#### Terminal 2: Frontend (Update API URL)
```bash
cd frontend

# Update .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8080/api" > .env.local

npm run dev
```

**Access:** `http://localhost:3000`

---

### Option 3: Full Docker Setup (Advanced)

#### Create docker-compose.yml (in project root)
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: mindgrid-backend
    ports:
      - "8080:8080"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/secrets:/app/secrets:ro
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: mindgrid-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8080/api
    depends_on:
      - backend
    restart: unless-stopped
EOF
```

#### Run with Docker Compose
```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Quick Reference Commands

### Backend Commands
```bash
# Start backend (local)
cd backend && source venv/bin/activate && python main.py

# Build Docker image
cd backend && docker build -t mindgrid-backend .

# Run Docker container
docker run -d --name mindgrid-backend -p 8080:8080 --env-file backend/.env mindgrid-backend

# View logs
docker logs -f mindgrid-backend
```

### Frontend Commands
```bash
# Start frontend (local)
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Start production server
cd frontend && npm start
```

### Docker Management
```bash
# List containers
docker ps -a

# Stop container
docker stop mindgrid-backend

# Remove container
docker rm mindgrid-backend

# Remove image
docker rmi mindgrid-backend

# Clean up (remove unused containers, networks, images)
docker system prune -a
```

### GCP Deployment
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/$PROJECT_ID/mindgrid-backend
gcloud run deploy mindgrid-backend --image gcr.io/$PROJECT_ID/mindgrid-backend --region us-central1
```

---

## Troubleshooting Commands

### Check Backend Health
```bash
# Local
curl http://localhost:8000/health

# Docker
curl http://localhost:8080/health

# Cloud Run
curl https://your-service-url.run.app/health
```

### Check Environment Variables
```bash
# In Docker container
docker exec mindgrid-backend env | grep -E "GEMINI|OPENROUTER|ELEVENLABS|FIREBASE"
```

### View Container Details
```bash
docker inspect mindgrid-backend
```

### Restart Everything
```bash
# Stop and remove
docker stop mindgrid-backend && docker rm mindgrid-backend

# Rebuild and run
cd backend
docker build -t mindgrid-backend .
docker run -d --name mindgrid-backend -p 8080:8080 --env-file .env mindgrid-backend
```

---

## Notes

1. **Port Numbers:**
   - Local backend: `8000`
   - Docker backend: `8080` (Cloud Run default)
   - Frontend: `3000`

2. **Environment Variables:**
   - Backend uses `.env` file in `backend/` directory
   - Frontend uses `.env.local` in `frontend/` directory
   - Docker can use `--env-file` or `-e` flags

3. **Firebase Credentials:**
   - Can use file path: `secrets/firebase_private.json`
   - Or JSON string: `FIREBASE_CREDENTIALS_JSON`

4. **API URLs:**
   - Local: `http://localhost:8000/api`
   - Docker: `http://localhost:8080/api`
   - Cloud Run: `https://your-service-url.run.app/api`

---

**Ready to run!** Choose the setup method that works best for your needs. 🚀

