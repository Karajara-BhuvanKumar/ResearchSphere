# ✅ ResearchSphere Express Backend - Testing Checklist

## Pre-Flight Checks

- [ ] Node.js installed (v18+)
- [ ] npm installed
- [ ] All dependencies installed in root: `npm install`
- [ ] All dependencies installed in server: `cd server && npm install`

## Server Startup

- [ ] Backend starts without errors: `cd server && npm run dev`
- [ ] Backend shows: "🚀 ResearchSphere API Server running on port 5000"
- [ ] Frontend starts without errors: `npm run dev`
- [ ] Frontend accessible at http://localhost:5173
- [ ] Backend health check works: http://localhost:5000/health

## API Endpoint Tests

Test each endpoint by visiting the pages:

### Publications Page
- [ ] Navigate to /publications
- [ ] Search for "machine learning"
- [ ] Results load without CORS errors
- [ ] Can switch between sources (Semantic Scholar, arXiv, OpenAlex, etc.)
- [ ] Pagination works
- [ ] Papers display with title, authors, abstract, date

### Journals Page
- [ ] Navigate to /journals
- [ ] Search for "computer science"
- [ ] Journals load from CrossRef
- [ ] No CORS errors in console
- [ ] Can click "View Journal" links

### Conferences Page
- [ ] Navigate to /conferences
- [ ] Search for "AI" or "machine learning"
- [ ] Conferences load from OpenAlex
- [ ] Display shows venue name, organization, stats
- [ ] No CORS errors

### Book Chapters Page
- [ ] Navigate to /book-chapters
- [ ] Search for "computer science"
- [ ] Books load from Google Books API
- [ ] Book covers display (if available)
- [ ] Preview links work

### Research Collaboration Page
- [ ] Navigate to /research-collaboration
- [ ] Search for "llama" or "bert"
- [ ] Hugging Face models load
- [ ] Shows downloads, likes, tags
- [ ] Links to Hugging Face work

### Project Calls Page
- [ ] Navigate to /project-calls
- [ ] Search for "conference"
- [ ] Opportunities load from OpenAlex and CrossRef
- [ ] Shows organization, date, type
- [ ] No CORS errors

### Home Page
- [ ] Navigate to /
- [ ] Recent publications load
- [ ] Featured journals load
- [ ] Trending topics display
- [ ] Stats show (2.5M+ papers, etc.)
- [ ] Search bar works

## Browser Console Checks

- [ ] No CORS errors in console
- [ ] No 404 errors for API calls
- [ ] No TypeScript errors
- [ ] Network tab shows requests to http://localhost:5000/api/*

## Backend Console Checks

- [ ] Server logs show incoming requests
- [ ] Format: "2025-11-25T... - GET /api/papers/arxiv"
- [ ] No error stack traces (unless expected)
- [ ] API responses logged

## Error Handling Tests

- [ ] Try invalid search query - should handle gracefully
- [ ] Stop backend server - frontend should show empty results
- [ ] Restart backend - frontend should work again
- [ ] Network errors handled without crashes

## Performance Checks

- [ ] Initial page load < 3 seconds
- [ ] API responses < 5 seconds
- [ ] No memory leaks (check Task Manager)
- [ ] Smooth scrolling and interactions

## Cross-Page Navigation

- [ ] Can navigate between all pages
- [ ] Back button works
- [ ] Search from home page works
- [ ] Links in navigation work

## Optional: API Key Tests

If you have API keys:

- [ ] Add SEMANTIC_SCHOLAR_API_KEY to server/.env
- [ ] Restart backend
- [ ] Test Semantic Scholar searches
- [ ] Should have higher rate limits

## Production Build Test

- [ ] `npm run build` completes without errors
- [ ] `npm run preview` works
- [ ] Built app functions correctly

## Documentation Review

- [ ] Read server/README.md
- [ ] Read MIGRATION_GUIDE.md
- [ ] Read IMPLEMENTATION_SUMMARY.md
- [ ] Understand architecture

## Final Verification

- [ ] All 7 pages work correctly
- [ ] No CORS errors anywhere
- [ ] All API integrations functional
- [ ] Ready for development/deployment

---

## If Everything Passes ✅

**Congratulations!** Your Express backend migration is successful!

You now have:
- ✅ A professional backend architecture
- ✅ Zero CORS issues
- ✅ Secure API key management
- ✅ Production-ready codebase
- ✅ Scalable foundation

## If Issues Found ❌

1. Check backend terminal for errors
2. Check frontend console for errors
3. Verify environment variables (.env files)
4. Ensure both servers are running
5. Check MIGRATION_GUIDE.md for troubleshooting
6. Review server/README.md for API documentation

---

**Testing Date**: _____________

**Tested By**: _____________

**Status**: ⬜ All Pass  ⬜ Issues Found  ⬜ In Progress
