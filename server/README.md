# ResearchSphere Express Backend

This is the Node.js/Express backend for ResearchSphere that handles all API integrations server-side, eliminating CORS issues.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure if needed:

```bash
cp .env.example .env
```

Default configuration:

- **PORT**: 5000
- **FRONTEND_URL**: http://localhost:5173

### 3. Start the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Health Check

- `GET /health` - Server health status

### Papers & Publications

- `GET /api/papers/search` - Search across all sources
- `GET /api/papers/arxiv` - arXiv papers
- `GET /api/papers/semantic-scholar` - Semantic Scholar papers
- `GET /api/papers/core` - CORE papers
- `GET /api/papers/openalex` - OpenAlex works
- `GET /api/papers/crossref` - CrossRef publications

### Journals

- `GET /api/journals` - Search journals

### Conferences

- `GET /api/conferences` - Search conferences

### Books

- `GET /api/books` - Google Books search

### Models

- `GET /api/models/huggingface` - Hugging Face models

### Project Opportunities

- `GET /api/projects/opportunities` - Research opportunities

### Sources

- `GET /api/sources` - OpenAlex sources (conferences & journals)

### Trending & Stats

- `GET /api/trending` - Trending topics
- `GET /api/stats` - Research statistics

### Combined Search

- `GET /api/search/all` - Search all APIs

### Website Harvest (CS-only, locally cached)

- `GET /api/harvest/search` - Search/filter locally harvested website data
- `POST /api/harvest/refresh` - Trigger manual refresh (`?force=true` optional)
- `GET /api/harvest/status` - Harvest cache status, configured sources, source health

## 🔧 Query Parameters

Most endpoints accept these common parameters:

- `query` - Search query string
- `limit` or `maxResults` or `rows` - Number of results (default varies by endpoint)
- `page` - Page number for pagination (where applicable)

For harvest search, supported filters:

- `query`
- `kind` (`conference`, `journal`, `opportunity`)
- `subtype` (`conference`, `journal`, `phd`, `postdoc`, `research`)
- `sourceId`
- `location`
- `limit`, `page`

Example:

```
GET /api/papers/arxiv?query=machine%20learning&maxResults=20
```

## 🛡️ Features

- ✅ **No CORS Issues** - All API calls happen server-side
- ✅ **Security** - Helmet.js for security headers
- ✅ **Compression** - Response compression enabled
- ✅ **Error Handling** - Comprehensive error handling
- ✅ **Logging** - Request logging for debugging
- ✅ **Environment Config** - Flexible configuration via .env

## 📦 Dependencies

- **express** - Web framework
- **cors** - CORS middleware
- **axios** - HTTP client for API calls
- **xml2js** - XML parser for arXiv
- **helmet** - Security middleware
- **compression** - Response compression
- **dotenv** - Environment configuration

## 🔐 API Keys (Optional)

Most APIs work without keys but have rate limits. You can add API keys in `.env`:

```env
SEMANTIC_SCHOLAR_API_KEY=your_key_here
CORE_API_KEY=your_key_here
```

## ✉️ Collaboration Email Setup

The contact page submits to `POST /api/collaboration/submit` and sends 2 emails:

- one notification to the teacher/admin (`COLLABORATION_EMAIL`)
- one confirmation to the requester

Add these variables in `server/.env` (or project root `.env`):

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_sender@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
COLLABORATION_EMAIL=teacher_or_admin@email.com
```

Notes:

- For Gmail, use a Google App Password (not your normal account password).
- `COLLABORATION_EMAIL` is optional; if omitted, it falls back to `EMAIL_USER`.
- If `EMAIL_USER`/`EMAIL_PASSWORD` are missing, the API returns a clear config error.

## 🐛 Debugging

The server logs all requests in the format:

```
2025-11-25T10:05:29.000Z - GET /api/papers/arxiv
```

Errors are logged with full stack traces in development mode.

## 📝 Notes

- The server is configured to accept requests from `http://localhost:5173` (Vite dev server)
- All responses are in JSON format with structure: `{ success: true, data: [...], count: N }`
- Failed API calls return empty arrays instead of errors to maintain frontend stability
- The website harvester stores normalized records in `server/data/harvest-cache.json`
- Harvester warmup runs on server startup and refreshes when cache is stale
