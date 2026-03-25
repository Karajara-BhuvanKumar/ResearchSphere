# ResearchSphere

A comprehensive platform designed to help researchers, academics, and institutions discover and connect with conferences, journals, and publication opportunities worldwide.

## 🎯 Overview

ResearchSphere streamlines the research publication process by aggregating opportunities from diverse fields and providing powerful search and filtering tools. Our platform connects researchers worldwide with the best opportunities for publication, collaboration, and knowledge sharing.

## ✨ Features

- **Universal Search**: Search across conferences, journals, and calls for papers from a single search bar
- **Advanced Filtering**: Filter by domain, region, submission deadlines, impact factor, and more
- **Comprehensive Database**: Access millions of research papers from multiple APIs
- **Multi-API Integration**: arXiv, Semantic Scholar, OpenAlex, CrossRef, CORE, Google Books, Hugging Face
- **No CORS Issues**: Express backend handles all API calls server-side
- **Responsive Design**: Fully responsive interface optimized for desktop, tablet, and mobile devices
- **Dark Mode Support**: Toggle between light and dark themes for comfortable viewing
- **Professional Academic Aesthetic**: Clean, modern design tailored for the academic community

## 🏗️ Architecture

### Backend (Express + Node.js)
- Handles all API integrations server-side
- Eliminates CORS errors
- Secures API keys
- Better error handling and logging
- Located in `server/` directory

### Frontend (React + Vite)
- Modern React application with TypeScript
- Tailwind CSS for styling
- shadcn/ui components
- React Query for data fetching

## 🚀 Quick Start

### Option 1: Use the Start Script (Recommended)
```bash
# Run both backend and frontend in separate windows
powershell -ExecutionPolicy Bypass -File start.ps1
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
npm run dev
```

Then open your browser to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
researchsphere-hub/
├── server/                    # Express backend
│   ├── routes/
│   │   └── api.js            # API route definitions
│   ├── services/
│   │   └── researchService.js # API integration logic
│   ├── .env                  # Environment config
│   ├── server.js             # Express server
│   ├── package.json          # Server dependencies
│   └── README.md             # Server documentation
├── src/                      # React frontend
│   ├── components/           # Reusable components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── pages/               # Page components
│   │   ├── Index.tsx
│   │   ├── Publications.tsx
│   │   ├── Journals.tsx
│   │   ├── Conferences.tsx
│   │   ├── BookChapters.tsx
│   │   ├── ProjectCalls.tsx
│   │   ├── ResearchCollaboration.tsx
│   │   ├── About.tsx
│   │   └── Contact.tsx
│   ├── services/
│   │   ├── apiClient.ts     # NEW: Backend API client
│   │   ├── api-types.ts     # Type definitions
│   │   └── api.ts           # OLD: Direct API calls (deprecated)
│   └── ...
├── .env                      # Frontend environment config
├── start.ps1                 # Quick start script
├── MIGRATION_GUIDE.md        # Migration documentation
└── README.md                 # This file
```

## 🛠️ Technologies Used

### Backend
- **Express** - Web framework
- **Node.js** - Runtime environment
- **Axios** - HTTP client for API calls
- **xml2js** - XML parser for arXiv
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Compression** - Response compression

### Frontend
- **React** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Lucide React** - Icon library
- **next-themes** - Dark mode support

## 📡 API Integrations

ResearchSphere integrates with the following research APIs:

1. **arXiv** - CS/AI focused preprint papers
2. **Semantic Scholar** - AI-powered research paper search
3. **OpenAlex** - Comprehensive research metadata (2025+)
4. **CrossRef** - Journal metadata and publications
5. **CORE** - Open access research papers
6. **Google Books** - Academic books and chapters
7. **Hugging Face** - AI models and datasets

All API calls are handled server-side to avoid CORS issues.

## 🔧 Configuration

### Backend Configuration (`server/.env`)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SEMANTIC_SCHOLAR_API_KEY=  # Optional
CORE_API_KEY=               # Optional
```

### Frontend Configuration (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 Documentation

- **Server API Documentation**: See `server/README.md`
- **Migration Guide**: See `MIGRATION_GUIDE.md`
- **API Integration Guide**: See `API_INTEGRATION_GUIDE.md`

## 🎨 Design System

The project uses a comprehensive design system with semantic color tokens:

- **Primary Colors**: Teal-based palette for main actions and accents
- **Secondary Colors**: Blue tones for complementary elements
- **Badge Colors**: Color-coded categories (blue, green, purple, orange)
- **Typography**: Inter font family for clean, professional text
- **Dark Mode**: Full support with theme-specific color tokens

## 📄 Available Pages

- **Home** - Landing page with search and featured content
- **Publications** - Search research papers across multiple sources
- **Journals** - Browse academic journals
- **Conferences** - Discover conference venues
- **Book Chapters** - Find academic books and chapters
- **Project Calls** - Research opportunities and calls for papers
- **Research Collaboration** - AI models and collaboration opportunities
- **About** - Platform information
- **Contact** - Get in touch

## 🔒 Security

- API keys are stored server-side only
- Helmet.js for security headers
- CORS configured for specific frontend origin
- Environment variables for sensitive data

## 🐛 Troubleshooting

### "Cannot connect to backend"
Make sure the Express server is running on port 5000:
```bash
cd server
npm run dev
```

### "CORS errors"
Check that `FRONTEND_URL` in `server/.env` matches your frontend URL (default: http://localhost:5173)

### "API returns empty arrays"
Check the server console for error messages. The backend logs all API errors.

## 🚢 Deployment

### Backend
Deploy the `server/` directory to any Node.js hosting service (Heroku, Railway, Render, etc.)

### Frontend
Build and deploy the frontend:
```bash
npm run build
# Deploy the dist/ directory
```

Update `.env` files with production URLs.

## 🤝 Contributing

This project is built by Bhuvan, Ayush, Pratham

## 📝 License

MIT License

## 🙏 Acknowledgments

- All the open research APIs that make this platform possible
- The open-source community for the amazing tools and libraries
