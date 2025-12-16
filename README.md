# 🔍 AI Code Review Assistant

A powerful, AI-powered code review assistant that combines static analysis, ML-inspired algorithms, and Google Gemini AI to provide comprehensive code reviews.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.0-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## ✨ Features

### 🤖 Triple-Layer Analysis
- **Static Analyzer** - Fast regex-based code checks (12+ languages supported)
- **ML Analyzer** - Pattern recognition, complexity scoring, bug risk prediction
- **Gemini AI** - Deep intelligent analysis with natural language explanations

### 📊 Comprehensive Metrics
- Quality Score (0-100)
- Readability Score
- Maintainability Score
- Security Score
- Performance Score
- Predicted Bug Risk

### 🌐 Multi-Language Support
JavaScript, TypeScript, Python, Java, Go, Rust, C++, C#, Ruby, PHP, Swift, Kotlin

### 🔐 Security Features
- JWT Authentication
- Secure API key storage
- Protected review history

### 📈 Dashboard & History
- Review history tracking
- Statistics visualization
- 7-day activity trends
- Language breakdown

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- (Optional) Docker

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/beridzemate00/CodeReview.git
   cd CodeReview
   ```

2. **Setup Backend**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the app**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Access at http://localhost
```

## 🔑 API Configuration

### Enable Gemini AI (Recommended)

1. Get your API key from [Google AI Studio](https://aistudio.google.com)
2. Go to **Settings** → **AI Configuration**
3. Enter your Gemini API key
4. Save changes

Or set as environment variable:
```bash
GEMINI_API_KEY=your-api-key-here
```

## 📁 Project Structure

```
code-review-assistant/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   │   ├── analyzer.ts      # Static analyzer
│   │   │   ├── mlAnalyzer.ts    # ML-powered analyzer
│   │   │   └── geminiAnalyzer.ts # Gemini AI integration
│   │   ├── middleware/      # Auth middleware
│   │   └── routes/          # API routes
│   ├── prisma/              # Database schema
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React contexts
│   │   └── App.tsx
│   ├── nginx.conf           # Production nginx config
│   └── Dockerfile
├── .github/workflows/       # CI/CD pipelines
└── docker-compose.yml
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (Prisma ORM)
- **Authentication**: JWT
- **AI**: Google Gemini API

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Vanilla CSS
- **Editor**: Monaco Editor
- **Icons**: Lucide React

### DevOps
- **CI/CD**: GitHub Actions
- **Containerization**: Docker
- **Orchestration**: Docker Compose

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/review` | Submit code for review |
| GET | `/api/review/history` | Get review history |
| GET | `/api/review/stats` | Get dashboard statistics |

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite database path | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `PORT` | Server port (default: 3000) | No |
| `GEMINI_API_KEY` | Google Gemini API key | No |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent code analysis
- Monaco Editor for the code editing experience
- The open source community

---

**Built with ❤️ for developers who care about code quality**
