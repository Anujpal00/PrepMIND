# PrepMind AI – AI-Powered Government Exam Preparation Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green)]()

## 📌 Problem Statement

Students preparing for Indian government competitive examinations (SSC, DSSSB, UPSC, Banking, Railway, State PCS) face critical challenges:

- **Fragmented Resources**: Study materials scattered across PDFs, coaching notes, and multiple platforms with no unified access
- **Manual Effort**: Manually extracting key concepts and creating practice questions from dense materials
- **Lack of Personalization**: No adaptive learning system that adapts to weak and strong subjects
- **Generic Question Banks**: Existing platforms don't provide exam-specific questions matching SSC, DSSSB, or UPSC patterns
- **Poor Analytics**: Limited insight into preparation progress and weak topics
- **Tool Fragmentation**: Students must juggle separate applications for notes, chat, mock tests, and analytics

## 🎯 Solution: PrepMind AI

PrepMind AI is an **integrated AI-powered learning ecosystem** that transforms scattered study materials into an interactive, personalized exam preparation system. Students can:

✅ **Upload & Chat with Materials**: Upload PDFs, DOCX, and notes; chat intelligently with your study materials powered by RAG + LLMs  
✅ **Auto-Generate Exam Questions**: Generate exam-specific MCQs matching SSC, DSSSB, UPSC patterns at custom difficulty levels  
✅ **Adaptive Topic Tests**: Create focused topic-wise tests or full-length SSC CGL mocks with real-time analytics  
✅ **Extract PDF Questions**: OCR/parse and extract existing previous-year questions from PDFs, with automated answer verification  
✅ **Performance Analytics**: Detailed subject-wise accuracy, weak topic identification, and progress tracking  
✅ **Unified Study Tools**: Notes, flashcards, study planner, and performance dashboard—all in one platform

---

## 🏗️ Architecture & Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11) + Uvicorn
- **Database**: MongoDB (async via Motor)
- **AI/LLMs**: Groq, Mistral, Emergent (via LiteLLM abstraction)
- **Vector Search**: Mistral embeddings for semantic chunking and retrieval
- **Storage**: AWS S3 (boto3)
- **Authentication**: JWT + bcrypt password hashing
- **Document Processing**: PyPDF, python-docx for text extraction

### Frontend
- **Framework**: React 18.2 + React Router 7
- **UI Components**: Radix UI + Shadcn/ui
- **Styling**: Tailwind CSS 3.4 + Framer Motion
- **State Management**: React Context API + TanStack Query (SWR)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics visualization
- **HTTP Client**: Axios

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: MongoDB (Docker service)
- **Reverse Proxy**: Nginx (frontend serving)
- **Health Checks**: Built-in for all services
- **Networks**: Docker bridge network for inter-service communication

---

## 🎨 Design System

**Theme**: Premium, confident, motivating study environment for serious exam aspirants

### Typography
- **Headings**: Outfit (Swiss Brutalist) – authoritative and clear
- **Body**: Manrope – high legibility for extended reading during study sessions

### Color Palette
| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Primary | Slate-900 (#0F172A) | Light Slate (#F8FAFC) |
| Accent (CTA) | Orange-600 (#EA580C) | Orange-500 (#F97316) |
| Success | Green-700 (#15803D) | Green-500 (#22C55E) |
| Background | Light Gray (#F8F9FA) | Deep Gray (#0B0F19) |
| Border | Light Slate (#E2E8F0) | Dark Slate (#1E293B) |

### Component Guidelines
- Sharp/rounded-md buttons (no over-rounded pill shapes)
- Cards with subtle borders, flat backgrounds, no shadows
- Sticky glassmorphic header: `backdrop-blur-xl bg-white/80`
- Focus states: `focus:ring-2 focus:ring-orange-500 focus:border-orange-500`
- All interactive elements: `data-testid` attribute for testing

---

## 📂 Project Structure

```
PrepMIND/
├── backend/
│   ├── server.py                 # FastAPI entrypoint
│   ├── auth.py                   # JWT authentication
│   ├── db.py                     # MongoDB connection
│   ├── storage.py                # AWS S3 client
│   ├── doc_processor.py          # PDF/DOCX text extraction
│   ├── mistral_client.py         # LLM integration (chat, embeddings)
│   ├── routes/
│   │   ├── materials.py          # Upload, list, delete materials; semantic retrieval
│   │   ├── chat.py               # RAG-powered Q&A with materials
│   │   ├── questions.py          # Auto-generate questions
│   │   ├── tests.py              # Topic tests, full mocks, result analysis
│   │   ├── notes.py              # User notes CRUD
│   │   ├── analytics.py          # Performance dashboards
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Backend container image
│   ├── pytest.ini                # Test configuration
│   └── tests/                    # Unit and integration tests
│
├── frontend/
│   ├── src/
│   │   ├── App.js                # Main routing
│   │   ├── pages/
│   │   │   ├── Landing.jsx       # Public landing page
│   │   │   ├── Login.jsx         # Authentication
│   │   │   ├── Register.jsx      # Sign-up
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── Materials.jsx     # Upload & manage materials
│   │   │   ├── ChatPage.jsx      # AI chat with materials
│   │   │   ├── QuestionGen.jsx   # Question generation
│   │   │   ├── TestsSetup.jsx    # Test creation UI
│   │   │   ├── TestEngine.jsx    # Fullscreen test taking
│   │   │   ├── TestResult.jsx    # Result analysis
│   │   │   ├── NotesPage.jsx     # User notes
│   │   │   ├── FlashcardsPage.jsx# Flashcards
│   │   │   ├── PlannerPage.jsx   # Study planner
│   │   ├── components/
│   │   │   ├── ui/               # Shadcn/ui components
│   │   │   ├── AppShell.jsx      # Main layout wrapper
│   │   ├── context/              # React Context (Auth, Theme)
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utilities (API client, validators)
│   │   ├── constants/            # App-wide constants
│   ├── public/                   # Static assets
│   ├── package.json              # Dependencies
│   ├── tailwind.config.js        # Tailwind customization
│   ├── craco.config.js           # Create React App override
│   ├── Dockerfile                # Frontend container image
│   └── nginx.conf                # Production Nginx config
│
├── docker-compose.yml            # Multi-service orchestration
├── design_guidelines.json        # Design system specs
└── README.md                     # This file
```

---

## 🚀 Core Features

### 1. **Material Upload & Management** (`/api/materials`)

Upload study materials in PDF, DOCX, TXT, or Markdown formats (up to 25MB each).

**Behind the scenes:**
- Automatic text extraction using PyPDF and python-docx
- Semantic chunking with overlapping context windows
- Vector embeddings via Mistral (1024-dim vectors)
- S3 storage with MongoDB metadata indexing
- Background async processing with health checks

**Endpoints:**
```
POST   /api/materials/upload          Upload a file
GET    /api/materials                 List all materials
GET    /api/materials/{material_id}   Get material details
GET    /api/materials/{material_id}/pages  Get page previews
DELETE /api/materials/{material_id}   Soft-delete material
```

---

### 2. **AI Chat with Materials** (`/api/chat`)

Interact with your study materials using RAG (Retrieval Augmented Generation).

**How it works:**
- Semantic search: converts your question into embeddings and retrieves top-5 relevant chunks
- Context injection: passes retrieved chunks + your question to Mistral LLM
- Answer synthesis: LLM generates a human-like tutor response citing page numbers
- Language support: English and Hindi responses

**System Prompt**: Tutor-like response style with minimal formatting, plain language, and page citations.

**Endpoints:**
```
POST   /api/chat/ask                  Chat with a material
GET    /api/chat/history/{material_id} Conversation history
```

**Example:**
```json
{
  "material_id": "abc-123",
  "message": "What are the types of federalism?",
  "language": "en"
}
```

---

### 3. **AI Question Generation** (`/api/questions`)

Auto-generate exam-pattern MCQs from materials or from scratch.

**Features:**
- **Exam Types**: SSC CGL, DSSSB, UPSC, Banking, Railway patterns
- **Difficulty Levels**: Easy, Medium, Hard, Mixed
- **Custom Scope**: Topic-wise or full-subject generation
- **Language**: English or Hindi (हिन्दी)
- **Batch Size**: 5–100 questions per generation

**Endpoints:**
```
POST   /api/questions/generate         Create questions
GET    /api/questions                  List generated questions
GET    /api/questions/{question_id}    Get single question
DELETE /api/questions/{question_id}    Remove from bank
```

---

### 4. **Mock Tests & Topic Tests** (`/api/tests`)

Create and take two types of tests:

#### **Topic Tests**
- Focused on a specific subject and optional sub-topic
- Customizable question count (5–100) and difficulty
- Short duration (auto-calculated ~1 min/question)
- No negative marks (or user-defined)

#### **Full Mock Tests**
- Full SSC CGL pattern: 100 questions, 60 minutes
  - General Intelligence & Reasoning: 25Q
  - Quantitative Aptitude: 25Q
  - English Comprehension: 25Q
  - General Awareness: 25Q
- 2 marks per question, 0.5 negative marks
- Perfect for end-to-end practice

#### **Extract & Test from PDFs**
- Extract existing questions from previous-year papers or question banks
- Verbatim question extraction (preserves exact text)
- Automatic or manual answer verification
- Create tests from extracted questions with custom timing

**Endpoints:**
```
POST   /api/tests/create               Create a topic or full mock
GET    /api/tests                      List all tests
GET    /api/tests/{test_id}            Get test details
POST   /api/tests/submit               Submit test and get results
GET    /api/tests/result/{result_id}   View result analysis
GET    /api/tests/results/all          All results history

POST   /api/tests/extract-from-pdf     Extract Q's from PDF (async job)
GET    /api/tests/extract-job/{job_id} Check extraction status
POST   /api/tests/start-from-extracted Start test from extracted Q's
```

---

### 5. **Performance Analytics** (`/api/analytics`)

Detailed performance tracking across all tests.

**Metrics:**
- **Accuracy**: % of correct answers
- **Score**: Total marks (accounting for negative marks)
- **Subject-wise Breakdown**: Correct/Incorrect/Skipped per subject
- **Weak Topics**: Automatically identified from low-performing topics
- **Time Analysis**: Time taken vs. recommended duration
- **Progress Trend**: Performance improvements over time

**Visualizations:**
- Accuracy trends (line chart)
- Subject-wise performance (bar chart)
- Answer distribution (pie chart)
- Time comparison (speed vs. accuracy)

---

### 6. **Study Tools**

#### **Notes** (`/api/notes`)
- Create, edit, and organize handwritten/typed notes
- Link notes to specific materials
- Quick search and tagging

#### **Flashcards** 
- Spaced repetition for memorization
- Front-back card design
- Difficulty-based scheduling

#### **Study Planner**
- Schedule study sessions per subject
- Track daily streaks
- Goal-setting and milestone tracking

---

## 🔐 Authentication & Security

### JWT-Based Auth
- **Token Expiry**: 30 days
- **Algorithm**: HS256
- **Header**: `Authorization: Bearer <token>`
- **Secrets**: Managed via environment variables

### Password Security
- Hashing: bcrypt with salt
- Validation: Email verification, password strength checks
- Endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`

---

## 🗄️ Database Schema (MongoDB)

### Collections

#### `users`
```javascript
{
  id: UUID,
  name: String,
  email: String (unique),
  password_hash: String,
  role: "student" | "admin",
  target_exam: "SSC CGL" | "UPSC" | ...,
  study_streak: Number,
  last_active: ISO8601,
  created_at: ISO8601
}
```

#### `materials`
```javascript
{
  id: UUID,
  user_id: UUID,
  filename: String,
  storage_path: String,
  size: Number,
  content_type: String,
  subject: String,
  topic: String,
  status: "processing" | "ready" | "failed",
  chunk_count: Number,
  page_count: Number,
  is_deleted: Boolean,
  created_at: ISO8601
}
```

#### `chunks`
```javascript
{
  id: UUID,
  material_id: UUID,
  page: Number,
  order: Number,
  text: String,
  embedding: [Float] // 1024-dim vector
}
```

#### `chat_messages`
```javascript
{
  id: UUID,
  user_id: UUID,
  material_id: UUID,
  role: "user" | "assistant",
  content: String,
  citations: [{page: Number, score: Float}],
  created_at: ISO8601
}
```

#### `tests`
```javascript
{
  id: UUID,
  user_id: UUID,
  test_type: "topic" | "mock" | "pdf_extracted",
  title: String,
  exam: String,
  subject: String,
  topic: String,
  language: "en" | "hi",
  duration_minutes: Number,
  negative_marks: Float,
  questions: [{
    id: UUID,
    section: String,
    subject: String,
    topic: String,
    passage: String,
    question: String,
    options: [String, String, String, String],
    correct_index: 0-3,
    explanation: String,
    marks: Float
  }],
  total_questions: Number,
  status: "ready" | "in-progress" | "completed",
  created_at: ISO8601
}
```

#### `results`
```javascript
{
  id: UUID,
  user_id: UUID,
  test_id: UUID,
  test_title: String,
  test_type: String,
  exam: String,
  total_questions: Number,
  correct: Number,
  incorrect: Number,
  skipped: Number,
  score: Float,
  max_marks: Float,
  accuracy: Float (0-100),
  percent_score: Float (0-100),
  time_taken_seconds: Number,
  by_subject: {
    "[subject_name]": {
      correct: Number,
      incorrect: Number,
      skipped: Number,
      total: Number
    }
  },
  answer_details: [{
    question_id: UUID,
    selected: 0-3 | null,
    correct: 0-3,
    result: "correct" | "incorrect" | "skipped"
  }],
  submitted_at: ISO8601
}
```

#### `notes`
```javascript
{
  id: UUID,
  user_id: UUID,
  material_id: UUID | null,
  title: String,
  content: String,
  tags: [String],
  is_pinned: Boolean,
  created_at: ISO8601,
  updated_at: ISO8601
}
```

**Indexes:**
- `users.email` (unique)
- `materials` (user_id, created_at)
- `chunks` (material_id)
- `results` (user_id, submitted_at)
- `chat_messages` (user_id, material_id, created_at)

---

## 🐳 Docker Setup & Deployment

### Quick Start

#### Prerequisites
- Docker & Docker Compose
- AWS S3 bucket credentials
- LLM API keys (Groq, Mistral, Emergent)

#### 1. Clone & Configure

```bash
git clone https://github.com/yourusername/prepmind-ai.git
cd PrepMIND

# Create .env files
cat > backend/.env <<EOF
MONGO_URL=mongodb://mongodb:27017
DB_NAME=prepmind_ai
GROQ_API_KEY=your_groq_key
MISTRAL_API_KEY=your_mistral_key
MISTRAL_CHAT_MODEL=mistral-large-latest
MISTRAL_EMBED_MODEL=mistral-embed
EMERGENT_LLM_KEY=your_emergent_key
JWT_SECRET=your_jwt_secret_change_in_prod
CORS_ORIGINS=http://localhost:3000,http://localhost:85
PYTHONUNBUFFERED=1
EOF

cat > frontend/.env <<EOF
REACT_APP_BACKEND_URL=http://localhost:8000
EOF
```

#### 2. Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Health check
curl http://localhost:8000/api/health
curl http://localhost:85/health
```

#### 3. Access Application

- **Frontend**: http://localhost:85
- **Backend API**: http://localhost:8000/api
- **API Docs**: http://localhost:8000/docs (FastAPI Swagger)
- **MongoDB**: mongodb://localhost:27017

### Service Details

| Service | Port | Image | Health Check |
|---------|------|-------|--------------|
| MongoDB | 27017 | mongo:latest | mongosh ping |
| Backend | 8000 | python:3.11-slim | `/api/health` |
| Frontend | 85 | nginx:alpine | `/health` |

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

```env
# Database
MONGO_URL=mongodb://mongodb:27017
DB_NAME=prepmind_ai

# LLM APIs
GROQ_API_KEY=sk-your-key
MISTRAL_API_KEY=your-key
MISTRAL_CHAT_MODEL=mistral-large-latest
MISTRAL_EMBED_MODEL=mistral-embed
EMERGENT_LLM_KEY=sk-emergent-your-key

# Security
JWT_SECRET=your-long-secret-key-min-32-chars
JWT_EXPIRE_DAYS=30

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:85,https://yourdomain.com

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=us-east-1

# App Config
APP_NAME=prepmind
PYTHONUNBUFFERED=1
```

### Frontend (`frontend/.env`)

```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
```

---

## 📖 API Documentation

### Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://api.prepmind.ai`

### Request/Response Format

All endpoints use **JSON** with `Content-Type: application/json`.

### Authentication
Include JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

### Response Schema
```json
{
  "data": { ... },
  "status": 200,
  "message": "Success"
}
```

### Error Handling
```json
{
  "detail": "Error message",
  "status": 400 | 401 | 404 | 500
}
```

### Common Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `413 Payload Too Large`: File exceeds 25MB
- `500 Internal Server Error`: Server error

---

## 🧪 Testing

### Run Tests

```bash
# Backend tests
cd backend
pip install -r requirements.txt
pytest -v

# Frontend tests
cd frontend
npm test

# Load testing
docker-compose exec backend pytest tests/ -v --cov=.
```

### Test Coverage

- **Auth**: Registration, login, JWT validation
- **Materials**: Upload, list, delete, retrieval
- **Chat**: RAG, embedding, LLM integration
- **Tests**: Question generation, submission, scoring
- **Analytics**: Accuracy calculation, subject-wise breakdown

---

## 🎓 Usage Examples

### 1. Register & Login

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raj Kumar",
    "email": "raj@example.com",
    "password": "securepass123",
    "target_exam": "SSC CGL"
  }'

# Response
{
  "token": "eyJhbGc...",
  "user": {
    "id": "abc-123",
    "name": "Raj Kumar",
    "email": "raj@example.com",
    "role": "student",
    "target_exam": "SSC CGL",
    "created_at": "2024-01-15T10:30:00Z"
  }
}

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "raj@example.com",
    "password": "securepass123"
  }'
```

### 2. Upload Materials

```bash
# Upload PDF
curl -X POST http://localhost:8000/api/materials/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@history_notes.pdf" \
  -F "subject=History" \
  -F "topic=Medieval India"

# Response
{
  "id": "mat-123",
  "filename": "history_notes.pdf",
  "subject": "History",
  "topic": "Medieval India",
  "status": "processing",
  "chunk_count": 0,
  "created_at": "2024-01-15T10:35:00Z"
}
```

### 3. Chat with Materials

```bash
# Ask a question
curl -X POST http://localhost:8000/api/chat/ask \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "material_id": "mat-123",
    "message": "Who were the Mughal emperors?",
    "language": "en"
  }'

# Response
{
  "id": "msg-456",
  "answer": "The Mughals ruled India for approximately 200 years. Key emperors include Akbar, who expanded the empire significantly [p.12], Shah Jahan who built the Taj Mahal [p.15], and Aurangzeb [p.18]...",
  "citations": [
    {"page": 12, "snippet": "Akbar expanded the Mughal empire..."},
    {"page": 15, "snippet": "Shah Jahan commissioned..."}
  ]
}
```

### 4. Generate Questions

```bash
# Topic test
curl -X POST http://localhost:8000/api/tests/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "test_type": "topic",
    "exam": "SSC CGL",
    "subject": "History",
    "topic": "Mughal Empire",
    "count": 15,
    "difficulty": "medium",
    "language": "en"
  }'

# Response
{
  "id": "test-789",
  "title": "History - Mughal Empire Topic Test",
  "test_type": "topic",
  "total_questions": 15,
  "duration_minutes": 15,
  "status": "ready",
  "questions": [
    {
      "id": "q1",
      "question": "Who was the founder of the Mughal Empire in India?",
      "options": ["Babur", "Akbar", "Aurangzeb", "Shah Jahan"],
      "correct_index": 0,
      "marks": 1.0
    },
    ...
  ]
}
```

### 5. Submit Test & Get Results

```bash
# Submit test
curl -X POST http://localhost:8000/api/tests/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "test_id": "test-789",
    "answers": {
      "q1": 0,
      "q2": 2,
      "q3": null,
      ...
    },
    "time_taken_seconds": 845
  }'

# Response
{
  "id": "result-111",
  "test_id": "test-789",
  "total_questions": 15,
  "correct": 12,
  "incorrect": 2,
  "skipped": 1,
  "score": 11.5,
  "max_marks": 15.0,
  "accuracy": 80.0,
  "percent_score": 76.67,
  "time_taken_seconds": 845,
  "by_subject": {
    "History": {
      "correct": 12,
      "incorrect": 2,
      "skipped": 1,
      "total": 15
    }
  },
  "submitted_at": "2024-01-15T11:00:00Z"
}
```

---

## 🚢 Production Deployment

### AWS EC2 Deployment

```bash
# SSH into instance
ssh -i key.pem ec2-user@your-ip

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo usermod -a -G docker $USER
sudo systemctl start docker

# Clone repo
git clone https://github.com/yourusername/prepmind-ai.git
cd PrepMIND

# Set environment variables
nano docker-compose.yml  # Update MongoDB, API URLs

# Deploy
docker-compose up -d

# Verify
curl https://your-domain/api/health
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy PrepMind

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build & Push Docker images
        run: |
          docker build -t prepmind-backend:latest ./backend
          docker build -t prepmind-frontend:latest ./frontend
          # Push to registry
      
      - name: Deploy to EC2
        run: |
          ssh -i ${{ secrets.EC2_KEY }} ec2-user@${{ secrets.EC2_IP }} \
            'cd /app && docker-compose pull && docker-compose up -d'
```

---

## 📊 Performance & Scalability

### Current Limits
- **File Upload**: 25 MB per file
- **Questions Generated**: 5–100 per batch
- **Concurrent Users**: ~100 (single-instance)
- **Response Time**: API <500ms, Chat <2s

### Optimization Tips
- Enable **query result caching** in MongoDB
- Use **CDN** for static assets (frontend)
- Batch **LLM API calls** (already implemented)
- Implement **Redis caching** for chat results
- Scale **backend workers** (currently 4 Uvicorn workers)

### Roadmap for Scale
- [ ] Multi-region MongoDB Atlas deployment
- [ ] Redis cache layer for embeddings
- [ ] Kubernetes orchestration (instead of Docker Compose)
- [ ] GraphQL API for mobile clients
- [ ] Websocket support for live test collaboration

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
docker-compose logs backend

# Check MongoDB connection
docker-compose exec backend python -c "from db import client; print(client.server_info())"

# Rebuild image
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Chat Returns Empty Results
- Ensure material status is `"ready"` (processing complete)
- Verify material has at least 100 characters of extractable text
- Check Mistral API key is valid and has quota

### Test Questions Not Generating
- Verify LLM API keys and quotas
- Check Mistral overload status
- Reduce question count (start with 5)

### Frontend Not Connecting to Backend
- Verify `REACT_APP_BACKEND_URL` in frontend `.env`
- Check CORS settings in `backend/.env`
- Ensure backend `/api/health` returns 200

---

## 🤝 Contributing

Contributions are invited! Follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Code Style
- Backend: PEP 8, formatted with Black
- Frontend: ESLint + Prettier
- Database: MongoDB naming conventions (snake_case)

---

## 🙏 Acknowledgments

Built with ❤️ for Indian exam aspirants.

**Key Technologies:**
- FastAPI & Pydantic for robust backend APIs
- React & TailwindCSS for responsive UI
- Mistral AI for embeddings and LLM responses
- MongoDB for flexible data storage
- Docker for seamless deployment

---

## 📋 Checklist for First-Time Setup

- [ ] Clone repository
- [ ] Install Docker & Docker Compose
- [ ] Create backend/.env with LLM API keys
- [ ] Create frontend/.env with backend URL
- [ ] Run `docker-compose up -d`
- [ ] Verify backend health: `curl http://localhost:8000/api/health`
- [ ] Verify frontend: Open http://localhost:85 in browser
- [ ] Register a test account
- [ ] Upload a sample PDF
- [ ] Ask a question via chat
- [ ] Generate a topic test
- [ ] Submit and review results

**Ready to ace your exams! 🎯**

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Maintain by**: Anuj Pal

