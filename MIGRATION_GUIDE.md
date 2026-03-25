# 🚀 Migration to Express Backend - Complete Guide

## Overview

We've successfully migrated ResearchSphere from a client-side API architecture to a **Node.js/Express backend** to eliminate CORS errors and improve the overall architecture.

## ✅ What Changed

### Before (Client-Side)
- ❌ Direct API calls from React frontend
- ❌ CORS errors with various APIs
- ❌ API keys exposed in frontend code
- ❌ Rate limiting issues
- ❌ No request caching

### After (Express Backend)
- ✅ All API calls handled server-side
- ✅ No CORS issues
- ✅ API keys secured on server
- ✅ Better error handling
- ✅ Potential for caching and rate limiting

## 📁 New Project Structure

```
researchsphere-hub/
├── server/                      # NEW: Express backend
│   ├── routes/
│   │   └── api.js              # API route definitions
│   ├── services/
│   │   └── researchService.js  # API integration logic
│   ├── .env                    # Environment config
│   ├── .env.example            # Environment template
│   ├── server.js               # Express server
│   ├── package.json            # Server dependencies
│   └── README.md               # Server documentation
├── src/
│   ├── services/
│   │   ├── api.ts              # OLD: Direct API calls (keep for reference)
│   │   ├── apiClient.ts        # NEW: Backend API client
│   │   └── api-types.ts        # NEW: Shared type definitions
│   └── ...
├── .env                        # Frontend environment config
└── ...
```

## 🔧 Setup Instructions

### Step 1: Install Server Dependencies

```bash
cd server
npm install
```

### Step 2: Configure Environment

The server is already configured with defaults:
- Server runs on port **5000**
- Accepts requests from **http://localhost:5173** (Vite dev server)

You can modify `server/.env` if needed.

### Step 3: Update Frontend Imports

**OLD CODE (Direct API calls):**
```typescript
import { fetchArxivPapers } from '@/services/api';
```

**NEW CODE (Through backend):**
```typescript
import { fetchArxivPapers } from '@/services/apiClient';
```

### Step 4: Run Both Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 🔄 API Migration Map

All functions have the same signatures, just import from `apiClient` instead of `api`:

| Function | Old Import | New Import |
|----------|-----------|------------|
| `fetchArxivPapers` | `@/services/api` | `@/services/apiClient` |
| `fetchSemanticScholarPapers` | `@/services/api` | `@/services/apiClient` |
| `fetchCOREPapers` | `@/services/api` | `@/services/apiClient` |
| `fetchOpenAlexWorks` | `@/services/api` | `@/services/apiClient` |
| `fetchCrossRefPublications` | `@/services/api` | `@/services/apiClient` |
| `fetchCrossRefJournals` | `@/services/api` | `@/services/apiClient` |
| `fetchGoogleBooks` | `@/services/api` | `@/services/apiClient` |
| `fetchHuggingFaceModels` | `@/services/api` | `@/services/apiClient` |
| `fetchProjectOpportunities` | `@/services/api` | `@/services/apiClient` |
| `fetchOpenAlexSources` | `@/services/api` | `@/services/apiClient` |
| `searchAllSources` | `@/services/api` | `@/services/apiClient` |
| `getTrendingTopics` | `@/services/api` | `@/services/apiClient` |
| `getResearchStats` | `@/services/api` | `@/services/apiClient` |
| `searchAllAPIs` | `@/services/api` | `@/services/apiClient` |

## 📝 Code Update Example

### Before:
```typescript
// In any component
import { fetchArxivPapers, fetchSemanticScholarPapers } from '@/services/api';

const papers = await fetchArxivPapers('machine learning', 20);
```

### After:
```typescript
// In any component
import { fetchArxivPapers, fetchSemanticScholarPapers } from '@/services/apiClient';

const papers = await fetchArxivPapers('machine learning', 20);
// Same function signature, just different import!
```

## 🎯 Next Steps

1. **Find all imports** from `@/services/api` in your codebase
2. **Replace** with `@/services/apiClient`
3. **Test** each page to ensure APIs work correctly
4. **Remove** the old `api.ts` file once migration is complete (optional)

## 🔍 Finding Files to Update

Run this command to find all files importing from the old API:

```bash
# PowerShell
Get-ChildItem -Recurse -Filter "*.tsx" | Select-String -Pattern "from '@/services/api'"

# Or use your IDE's "Find in Files" feature
# Search for: from '@/services/api'
# Replace with: from '@/services/apiClient'
```

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"
**Solution:** Make sure the Express server is running on port 5000
```bash
cd server
npm run dev
```

### Issue: "CORS errors still appearing"
**Solution:** Check that `FRONTEND_URL` in `server/.env` matches your frontend URL (default: http://localhost:5173)

### Issue: "API returns empty arrays"
**Solution:** Check the server console for error messages. The backend logs all API errors.

## 🎉 Benefits

1. **No More CORS Errors** - All API calls are server-side
2. **Better Security** - API keys stay on the server
3. **Easier Debugging** - Server logs show all API requests
4. **Future-Ready** - Easy to add caching, rate limiting, authentication
5. **Better Performance** - Potential for server-side caching

## 📚 Additional Resources

- Server API Documentation: `server/README.md`
- Frontend Environment Config: `.env`
- Server Environment Config: `server/.env`

---

**Need Help?** Check the server logs for detailed error messages!
