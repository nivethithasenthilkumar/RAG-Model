# 📚 DocuMind — AI-Powered Document Intelligence (RAG)

> **Upload documents. Ask questions. Get AI-powered answers** — built with Retrieval-Augmented Generation (RAG), Google Gemini, and Endee Vector DB.
https://drive.google.com/file/d/1IT3eTsSCplovP3ZCDNW2UqwlrNM5HzjG/view?usp=sharing
---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-based login/register + Google & GitHub OAuth |
| 📄 **Document Upload** | Supports PDF, DOCX, and TXT file uploads |
| 🧠 **RAG Pipeline** | Extracts text → generates embeddings → stores in vector DB → semantic search |
| 🤖 **AI Chat** | Ask questions about your documents using Google Gemini AI |
| 📊 **Analytics Dashboard** | Query history, document stats, and usage charts |
| 🌗 **Dark/Light Mode** | Pista Green (dark) + Gold (light) themed UI |
| 📱 **iPhone-style UI** | Stunning mobile-frame design with 3D flip animation |
| ✨ **Custom Cursor** | Book emoji cursor with glitter trail particles |

---

## 🏗️ Architecture

docmind-project/ ├── frontend/ # React 18 (CRA) — Port 3000 │ ├── src/ │ │ ├── components/ # AnimatedBackground, BookCursor │ │ ├── context/ # AuthContext, ThemeContext │ │ ├── pages/ # LoginPage, RegisterPage, DashboardPage │ │ ├── services/ # Axios API client │ │ └── styles/ # global.css (design system) │ └── .env │ ├── backend/ # Node.js + Express — Port 5000 │ ├── src/ │ │ ├── config/ # database.js (SQLite), passport.js (OAuth) │ │ ├── middleware/ # auth.js (JWT verification) │ │ ├── routes/ # auth, documents, rag, health │ │ └── services/ # endee.js (Vector DB), embeddings.js, textExtractor.js │ └── .env
### How the RAG Pipeline Works
User uploads document ↓ Text extracted (PDF/DOCX/TXT) ↓ Text split into chunks ↓ Embeddings generated (Gemini) ↓ Vectors stored in Endee DB ↓ User asks a question ↓ Question → embedding → semantic search ↓ Top-K relevant chunks retrieved ↓ Chunks + question → Gemini AI → Answer

---
## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Axios |
| **Backend** | Node.js, Express.js |
| **Auth** | JWT, Passport.js (Google + GitHub OAuth) |
| **Database** | SQLite (users & docs metadata via `better-sqlite3`) |
| **Vector DB** | Endee Vector DB (HNSW cosine similarity) |
| **AI Engine** | Google Gemini API (`@google/generative-ai`) |
| **Text Extraction** | `pdf-parse` (PDF), `mammoth` (DOCX) |
| **Styling** | Vanilla CSS with glassmorphism, Inter + Outfit fonts |
---
## 🚀 Quick Start
### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **Gemini API Key** — [Get free key](https://aistudio.google.com/app/apikey)
- **Endee Vector DB** (optional) — `docker run -p 8080:8080 endeeio/endee-server:latest`
- 
### 1. Clone the repo
```bash
git clone https://github.com/nivethithasenthilkumar/RAG-Model.git
cd RAG-Model/docmind-project
2. Setup Backend
bash
cd backend
npm install
Create a .env file (or edit the existing one):

env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
ENDEE_BASE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
Start the backend:

bash
npm run dev
3. Setup Frontend
bash
cd ../frontend
npm install
Create a .env file (or edit the existing one):

env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
Start the frontend:

bash
npm start
4. Open the app
Navigate to http://localhost:3000 — the app will open with the iPhone-style mobile frame UI.

📡 API Endpoints

Method	Endpoint	Description
GET	/api/health	Server health check
GET	/api/stats	System statistics
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login (returns JWT)
GET	/api/auth/profile	Get current user profile
GET	/api/auth/google	Google OAuth login
GET	/api/auth/github	GitHub OAuth login
GET	/api/documents	List user's documents
POST	/api/documents/upload	Upload a document (multipart)
DELETE	/api/documents/:id	Delete a document
POST	/api/rag/search	Semantic search / ask question
GET	/api/rag/analytics	RAG usage analytics
GET	/api/rag/history	Query history
🎨 UI Design
Light Mode — Gold & White with warm gradients
Dark Mode — Pista Green & Black with neon glows
iPhone 17 Pro frame — 3D flip animation showing camera island on back
Animated background — Floating glitter balls + ambient blobs
Custom book cursor — Replaces default cursor with a 📖 emoji + sparkle trail
Glassmorphism cards — Frosted glass UI with backdrop blur
📁 Key Files
File	Purpose
backend/src/index.js	Express server entry point
backend/src/config/database.js	SQLite DB setup (users, documents tables)
backend/src/config/passport.js	Google & GitHub OAuth strategies
backend/src/services/endee.js	Endee Vector DB client (CRUD + search)
backend/src/services/embeddings.js	Text → vector embedding generation
backend/src/services/textExtractor.js	PDF/DOCX/TXT text extraction
backend/src/routes/rag.js	RAG search & AI answer generation
frontend/src/App.js	React app with 3D phone frame layout
frontend/src/pages/DashboardPage.jsx	Main dashboard (upload, chat, analytics)
frontend/src/styles/global.css	Complete design system (929 lines)
📜 License
MIT License — free to use, modify, and distribute.

