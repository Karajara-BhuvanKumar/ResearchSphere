# ResearchSphere - API Integration Guide

## 📚 Integrated APIs Overview

ResearchSphere now integrates with **4 major academic research APIs** to provide real-time data. All APIs are **free** and require **no authentication keys**.

---

## 1. arXiv API

### **What it provides**
- Research papers and preprints
- Primarily physics, mathematics, computer science, and related fields
- Author information
- Abstracts and publication dates
- Categories and subjects

### **Endpoint**
```
http://export.arxiv.org/api/query
```

### **Example Usage in ResearchSphere**
```typescript
fetchArxivPapers('machine learning', 20)
```

### **Response Format**
- XML format (parsed to JSON in our service)
- Returns: title, authors, abstract, published date, category, URL

### **Rate Limits**
- No strict rate limits
- Recommended: 1 request per 3 seconds for bulk operations

### **Documentation**
https://arxiv.org/help/api/

---

## 2. OpenAlex API

### **What it provides**
- Comprehensive research database
- Papers, authors, institutions, concepts
- Citation counts
- DOIs and publication metadata
- Topics and keywords

### **Endpoint**
```
https://api.openalex.org
```

### **Example Usage in ResearchSphere**
```typescript
fetchOpenAlexWorks('artificial intelligence', 1)
```

### **Response Format**
- JSON format
- Returns: title, authors, abstract, publication date, citations, DOI, topics

### **Rate Limits**
- 100,000 requests per day (no key required)
- 10 requests per second

### **Documentation**
https://docs.openalex.org/

---

## 3. CrossRef API

### **What it provides**
- Journal metadata
- DOI resolution
- Publisher information
- ISSN numbers
- Publication records

### **Endpoint**
```
https://api.crossref.org
```

### **Example Usage in ResearchSphere**
```typescript
// For journals
fetchCrossRefJournals('science', 20)

// For publications
fetchCrossRefPublications('research', 20)
```

### **Response Format**
- JSON format
- Returns: title, publisher, ISSN, subjects, DOI, authors

### **Rate Limits**
- No authentication: 50 requests per second
- With authentication: Higher limits available

### **Documentation**
https://www.crossref.org/documentation/retrieve-metadata/rest-api/

---

## 4. DBLP API

### **What it provides**
- Computer science bibliography
- Conference papers
- Journal articles in CS
- Author information
- Publication venues

### **Endpoint**
```
https://dblp.org/search/publ/api
```

### **Example Usage in ResearchSphere**
```typescript
fetchDBLPPublications('machine learning', 20)
```

### **Response Format**
- JSON or XML (we use JSON)
- Returns: title, authors, year, venue, DOI, URL

### **Rate Limits**
- No strict limits
- Be respectful with request frequency

### **Documentation**
https://dblp.org/faq/How+to+use+the+dblp+search+API.html

---

## 🔧 How APIs are Used in ResearchSphere

### **Homepage**
- **arXiv API**: Fetches 8 recent AI papers for "Recent Publications" section
- **CrossRef API**: Fetches 6 journals for "Featured Journals" section
- **Stats**: Aggregated from multiple sources

### **Publications Page**
- **All Sources**: Combines results from arXiv, OpenAlex, CrossRef, and DBLP
- **arXiv Only**: Direct arXiv search
- **OpenAlex Only**: Direct OpenAlex search
- **Search**: User query sent to selected source(s)

### **Journals Page**
- **CrossRef API**: Primary source for journal data
- **Search**: Query sent to CrossRef journals endpoint
- **Pagination**: Client-side pagination of API results

---

## 📊 Data Flow

```
User Search
    ↓
React Query (Cache Check)
    ↓
API Service Layer (src/services/api.ts)
    ↓
External API (arXiv/OpenAlex/CrossRef/DBLP)
    ↓
Response Parsing & Transformation
    ↓
Type-Safe Data (Paper/Journal interfaces)
    ↓
React Components
    ↓
User Interface
```

---

## 🎯 Caching Strategy

### **React Query Configuration**
```typescript
{
  queryKey: ['publications', searchQuery, source],
  queryFn: () => fetchData(),
  staleTime: 1000 * 60 * 5, // 5 minutes
}
```

### **Cache Times**
- **Papers**: 5-10 minutes
- **Journals**: 10 minutes
- **Trending Topics**: 30 minutes
- **Stats**: 1 hour

### **Benefits**
- Reduced API calls
- Faster page loads
- Better user experience
- Respects API rate limits

---

## 🛠️ API Service Functions

### **Core Functions** (`src/services/api.ts`)

#### `fetchArxivPapers(query, maxResults)`
Fetches research papers from arXiv.

#### `fetchOpenAlexWorks(query, page)`
Fetches works from OpenAlex with pagination.

#### `fetchCrossRefJournals(query, rows)`
Fetches journal metadata from CrossRef.

#### `fetchCrossRefPublications(query, rows)`
Fetches publication records from CrossRef.

#### `fetchDBLPPublications(query, maxResults)`
Fetches CS publications from DBLP.

#### `searchAllSources(query, limit)`
Aggregates results from all APIs.

#### `getTrendingTopics()`
Returns trending research topics.

#### `getResearchStats()`
Returns platform statistics.

---

## 🔍 Search Examples

### **Good Search Queries**
- "machine learning"
- "climate change"
- "quantum computing"
- "artificial intelligence"
- "renewable energy"
- "neuroscience"
- "biotechnology"

### **Tips for Best Results**
1. Use specific keywords
2. Avoid very broad terms
3. Try different APIs for different results
4. Use 2-3 word phrases for best matches

---

## ⚠️ Error Handling

### **Network Errors**
- Graceful fallback to empty arrays
- Error messages logged to console
- User sees empty state with helpful message

### **API Failures**
- Try/catch blocks around all API calls
- Promise.allSettled for aggregate searches
- Partial results shown if some APIs fail

### **Rate Limiting**
- Caching reduces API calls
- Debouncing on search inputs (can be added)
- Respectful request patterns

---

## 🚀 Future API Enhancements

### **Potential Additions**
1. **Semantic Scholar API**: More AI/CS papers
2. **PubMed API**: Medical research
3. **IEEE Xplore API**: Engineering papers
4. **Springer API**: More journals
5. **Google Scholar**: Broader coverage (unofficial)

### **Advanced Features**
1. **Filters**: Date range, citation count, open access
2. **Sorting**: By relevance, date, citations
3. **Related Papers**: Based on current selection
4. **Author Profiles**: Aggregate author publications
5. **Citation Networks**: Visualize paper relationships

---

## 📝 API Response Examples

### **arXiv Response (Parsed)**
```typescript
{
  id: "http://arxiv.org/abs/2301.12345",
  title: "Advances in Machine Learning",
  authors: ["John Doe", "Jane Smith"],
  abstract: "This paper presents...",
  publishedDate: "1/15/2024",
  category: "cs.LG",
  url: "http://arxiv.org/abs/2301.12345",
  source: "arXiv"
}
```

### **OpenAlex Response (Parsed)**
```typescript
{
  id: "https://openalex.org/W1234567890",
  title: "Deep Learning Applications",
  authors: ["Alice Johnson"],
  abstract: "We explore...",
  publishedDate: "2/20/2024",
  category: "Artificial Intelligence",
  url: "https://doi.org/10.1234/example",
  source: "OpenAlex",
  doi: "10.1234/example",
  citationCount: 42
}
```

### **CrossRef Journal Response (Parsed)**
```typescript
{
  id: "1234-5678",
  title: "Nature Machine Intelligence",
  publisher: "Springer Nature",
  issn: "1234-5678",
  subjects: ["AI", "Machine Learning"],
  url: "https://search.crossref.org/?q=...",
  openAccess: false
}
```

---

## 🎓 Learning Resources

### **API Documentation**
- [arXiv API Guide](https://arxiv.org/help/api/)
- [OpenAlex Docs](https://docs.openalex.org/)
- [CrossRef REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [DBLP API](https://dblp.org/faq/How+to+use+the+dblp+search+API.html)

### **Related Technologies**
- [React Query Docs](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

## ✅ Best Practices

1. **Always handle errors gracefully**
2. **Use TypeScript for type safety**
3. **Implement caching to reduce API calls**
4. **Respect rate limits**
5. **Parse and validate API responses**
6. **Provide loading states**
7. **Show helpful error messages**
8. **Log errors for debugging**

---

*This guide covers all API integrations in ResearchSphere. For questions or issues, refer to the official API documentation.*
