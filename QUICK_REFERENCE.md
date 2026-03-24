# 🎯 ResearchSphere Express Backend - Quick Reference

## 🚀 Start Commands

### Quick Start (Both Servers)
```powershell
powershell -ExecutionPolicy Bypass -File start.ps1
```

### Manual Start
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

## 🌐 URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React App |
| Backend API | http://localhost:5000/api | Express Server |
| Health Check | http://localhost:5000/health | Server Status |

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/papers/search` | GET | Search all sources |
| `/api/papers/arxiv` | GET | arXiv papers |
| `/api/papers/semantic-scholar` | GET | Semantic Scholar |
| `/api/papers/openalex` | GET | OpenAlex works |
| `/api/papers/crossref` | GET | CrossRef publications |
| `/api/papers/core` | GET | CORE papers |
| `/api/journals` | GET | Academic journals |
| `/api/conferences` | GET | Conference venues |
| `/api/books` | GET | Google Books |
| `/api/models/huggingface` | GET | HuggingFace models |
| `/api/projects/opportunities` | GET | Research opportunities |
| `/api/sources` | GET | OpenAlex sources |
| `/api/trending` | GET | Trending topics |
| `/api/stats` | GET | Research statistics |
| `/api/search/all` | GET | Combined search |

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server/server.js` | Express server entry point |
| `server/routes/api.js` | API route definitions |
| `server/services/researchService.js` | API integration logic |
| `server/.env` | Backend configuration |
| `src/services/apiClient.ts` | Frontend API client |
| `.env` | Frontend configuration |
| `start.ps1` | Quick start script |

## 🔧 Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
SEMANTIC_SCHOLAR_API_KEY=
CORE_API_KEY=
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🎨 Updated Pages

| Page | File | API Used |
|------|------|----------|
| Home | `Index.tsx` | Semantic Scholar, CrossRef, Stats |
| Publications | `Publications.tsx` | All paper APIs |
| Journals | `Journals.tsx` | CrossRef |
| Conferences | `Conferences.tsx` | OpenAlex |
| Books | `BookChapters.tsx` | Google Books |
| Collaboration | `ResearchCollaboration.tsx` | Hugging Face |
| Project Calls | `ProjectCalls.tsx` | OpenAlex, CrossRef |

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| CORS errors | Make sure backend is running |
| Empty results | Check backend console for API errors |
| Connection refused | Verify backend is on port 5000 |
| 404 errors | Check VITE_API_URL in .env |

## 📊 Architecture Flow

```
User → Frontend (React) → Backend (Express) → External APIs
       Port 5173          Port 5000            (No CORS!)
```

## ✅ Success Indicators

- ✅ No CORS errors in browser console
- ✅ Backend logs show API requests
- ✅ All pages load data successfully
- ✅ Search functionality works
- ✅ Both servers running smoothly

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Main project documentation |
| `server/README.md` | Backend API documentation |
| `MIGRATION_GUIDE.md` | Migration instructions |
| `IMPLEMENTATION_SUMMARY.md` | What was built |
| `TESTING_CHECKLIST.md` | Testing guide |

## 🎯 Next Steps

1. ✅ Run `start.ps1` to start both servers
2. ✅ Open http://localhost:5173
3. ✅ Test each page
4. ✅ Verify no CORS errors
5. ✅ Check TESTING_CHECKLIST.md

## 💡 Pro Tips

- **Development**: Keep both terminal windows visible
- **Debugging**: Check backend terminal for API errors
- **Testing**: Use browser DevTools Network tab
- **Production**: Deploy backend and frontend separately

---

**Need Help?** Check the documentation files or review the backend logs!
