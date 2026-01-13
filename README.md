<div align="center">

_Textbook becomes mind map, **before** you even finish reading._

**MindGrid** = your brain's neural network + the grid structure of knowledge. Because learning should work the way your mind does.

</div>

<!-- Badges -->

[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-%2306B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Shadcn](https://img.shields.io/badge/Shadcn-UI-000000?logo=shadcn&logoColor=white)](https://ui.shadcn.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-%23009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Firebase](https://img.shields.io/badge/Firebase-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-111111)](https://openrouter.ai/)
[![Google Gemini](https://img.shields.io/badge/Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Voice-orange)](https://www.elevenlabs.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![GCP](https://img.shields.io/badge/Google%20Cloud-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

---

## Why It Exists

Traditional learning treats your brain like a filing cabinet—stuffing in linear facts and hoping they somehow stick together. You read 200 pages sequentially, memorizing isolated data points while missing the big picture. It’s like trying to navigate a city by looking at a single street through a straw.

The reality? Your brain is a network, not a list.

True mastery isn't about knowing facts; it’s about understanding systems. When you truly "get" a subject, you see how Concept A influences Concept B, which eventually constructs Concept C. MindGrid is built to mirror this natural cognitive process.

Instead of starting at page one, MindGrid allows you to upload a textbook and instantly see the entire landscape. By visualizing the conceptual network first, you identify the "gravity centers" of a subject, surfacing the hidden relationships that linear notes hide.

The Problem: Linear learning hides connections, leading to rote memorization and quick forgetting.

The Solution: Conceptual networks surface relationships, allowing you to learn faster and retain knowledge longer.

Whether it’s last-minute exam prep or mastering a complex new field, MindGrid helps you stop reading lines and start seeing the grid.

## Features

- **Drag & drop PDFs** - Works with any textbook, lecture notes, research papers
- **Interactive knowledge graphs** - Click nodes, explore connections, zoom in/out
- **Deep concept exploration** - Click on any node in the graph to get an instant AI explanation of just that specific concept, without needing to re-read the book.
- **AI-generated study guides** - Overviews, summaries, key concepts
- **Audio study materials** - Listen to your content while commuting/gym
- **Smart concept mapping** - AI finds relationships you'd miss reading linearl

## How It Works

1. **PDF → Text** → pypdf extracts raw content and structural data from uploaded textbooks and documents.
2. **Text → Digest** → analyzes the raw text to distill core concepts, critical formulas, and logical learning sequences.
3. **Digest → Graph** → Google Gemini 2.5 structures the concepts into a deep hierarchical network, defining root nodes and logical branches.
4. **Graph →  Study Aids** → The system automatically generates exam-prep overviews, detailed cheat sheets, and structured conceptual breakdowns.
5. **Script → Audio** → ElevenLabs converts the AI-generated "buddy-style" script into a realistic audio summary for on-the-go learning.
Result: Interactive concept map you can explore + AI-generated study materials

## Setup

**Prerequisites:**

- Python 3.11+
- Node.js 18+ (20+ Recommended)
- API keys (see below)
- Firebase Project (Firestore enabled)

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Server runs on `http://localhost:8000`

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:3000`

**Test it:**

1. Go to `localhost:3000`
2. Drop a PDF (textbook, lecture notes, etc.)
3. Watch it process and generate your knowledge graph

## API Keys

```bash
# backend/.env
GEMINI_API_KEY=your_key           # Graph construction & relationships (Google AI Studio)
OPENROUTER_API_KEY=your_key       # Fast summaries & study guides (Grok 4 via OpenRouter)
ELEVENLABS_API_KEY=your_key        # High-quality audio generation
FIREBASE_SERVICE_ACCOUNT_PATH=secrets/firebase_private.json   # Local path
```

> [!WARNING]
> ElevenLabs Free Tier works for **localhost development only**. Cloud deployments (GCP, AWS, etc.) are blocked due to shared IP abuse prevention. For production audio generation, either:
>
> - Upgrade to [ElevenLabs Paid Plan](https://elevenlabs.io/pricing) ($5/month)
> - Switch to other TTS services

## Tech Stack

**Backend:**

- **FastAPI** - High-performance Python web framework for the core API logic
- **PyPDF** - PDF processing library for extracting text from academic textbooks
- **OpenRouter (Grok 4 Fast)** - Powers AI digests, quick cheatsheets, and audio scripts
- **Google Gemini 2.5 Flash Lite** - Handles deep concept analysis and complex relationship mappingg
- **Google Gemini 2.0 Flash Lite** - Provides instant concept overviews via Cmd+Shift+Click node interactions
- **ElevenLabs** - Generates realistic AI audio summaries for auditory learning
- **Firebase Firestore** - NoSQL document database for storing projects and concept metadata
- **Docker** - Containerization for consistent deployment and scaling

**Frontend:**

- **Next.js 15** - React framework using the App Router for optimized routing and SSR
- **React Force Graph** - Interactive 2D/3D visualization for the knowledge graph network
- **TailwindCSS** - Utility-first CSS framework for rapid UI development and light themes
- **Shadcn UI** - Accessible and customizable component library
- **TypeScript** - Ensures type-safety across the frontend architecture
- **Vercel** - Global Edge Network for frontend hosting and performance

**Cloud & Deployment:**

- **Render** - Managed cloud platform for hosting the Python/FastAPI backend
- **Firebase** - Comprehensive suite for authentication and NoSQL database management
- **Vercel** - Deployment platform for the Next.js frontend and CI/CD integration

## View more about MindGrid 👇

[Devpost](https://devpost.com/software/mindgrid)

---

_Your brain thinks in networks. Your textbook should too._

_Studying with MindGrid is just like navigating the earth on the atmosphere._
