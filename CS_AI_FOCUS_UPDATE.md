# ResearchSphere - CS/IT/AI Focus Update

## 🎯 Updates Made (Based on Your Feedback)

### **Issues Fixed:**
1. ✅ **Homepage Data Loading** - Fixed! Now showing real CS/AI/ML papers from Semantic Scholar
2. ✅ **CS/IT/AI Focus** - Platform now specifically targets Computer Science, IT, and AI research
3. ✅ **Better APIs** - Integrated Semantic Scholar (best for CS) and improved existing APIs

---

## 🔬 **New APIs Integrated**

### **1. Semantic Scholar API** ⭐ PRIMARY SOURCE
- **Why**: Best free API for Computer Science and AI research
- **What it provides**:
  - High-quality CS/AI/ML papers
  - Citation counts
  - Venue information
  - Author details
  - Publication dates
- **Focus**: Automatically filters for "Computer Science" field
- **URL**: https://www.semanticscholar.org/product/api
- **Rate Limit**: Free, no key required
- **Quality**: ⭐⭐⭐⭐⭐ Excellent for CS research

### **2. CORE API** (Added but not yet used in UI)
- **Why**: Largest collection of open-access research papers
- **What it provides**:
  - Open access CS papers
  - Full-text availability
  - Metadata
- **URL**: https://core.ac.uk/services/api
- **Rate Limit**: Free, no key required
- **Quality**: ⭐⭐⭐⭐ Good for open access content

### **3. arXiv API** (Improved)
- **Changes**: Now filters ONLY CS categories
  - cs.AI (Artificial Intelligence)
  - cs.LG (Machine Learning)
  - cs.CV (Computer Vision)
  - cs.CL (Computational Linguistics/NLP)
  - cs.NE (Neural Networks)
  - cs.IT (Information Theory)
  - cs.CR (Cryptography)
- **Quality**: ⭐⭐⭐⭐⭐ Excellent for latest CS preprints

### **4. OpenAlex API** (Improved)
- **Changes**: Now filters for Computer Science concept (ID: C41008148)
- **Quality**: ⭐⭐⭐⭐ Good for comprehensive data

### **5. CrossRef API** (Improved)
- **Changes**: Queries now include "computer science" keywords
- **Quality**: ⭐⭐⭐ Good for journal metadata

---

## 🎨 **CS/IT/AI Themed Changes**

### **Trending Topics** (Updated)
Now shows CS-specific topics:
- Machine Learning
- Artificial Intelligence
- Deep Learning
- Natural Language Processing
- Computer Vision
- Cybersecurity
- Cloud Computing
- Blockchain
- Data Science
- Neural Networks
- Reinforcement Learning
- Edge Computing

### **Default Queries** (All CS-focused)
- **Homepage**: "machine learning deep learning"
- **Publications**: "machine learning"
- **Journals**: "computer science artificial intelligence"

### **Auto CS Context**
- Search queries automatically add "computer science" context if not present
- Ensures all results are relevant to CS/IT/AI

---

## 📊 **Data Quality Improvements**

### **Before:**
- Generic research from all fields
- Mixed quality results
- Some APIs returning empty data
- No CS focus

### **After:**
- ✅ **100% CS/IT/AI focused**
- ✅ **High-quality papers** from Semantic Scholar
- ✅ **Citation counts** visible
- ✅ **Venue information** included
- ✅ **Better error handling**
- ✅ **Retry logic** (2 retries on failure)
- ✅ **Duplicate removal**
- ✅ **Sorted by citations** (most cited first)

---

## 🔧 **Technical Improvements**

### **API Service** (`src/services/api.ts`)
1. **Better XML Parsing** for arXiv
   - Error checking for malformed XML
   - Whitespace normalization
   - Validation before adding to results

2. **CS-Specific Filtering**
   - arXiv: Only CS categories
   - OpenAlex: Computer Science concept filter
   - Semantic Scholar: Computer Science field filter

3. **Improved Error Handling**
   - Try-catch blocks around all API calls
   - Console warnings instead of errors
   - Graceful fallbacks to empty arrays
   - HTTP status code checking

4. **Better Data Quality**
   - Duplicate removal by title
   - Citation-based sorting
   - Validation of required fields

### **Homepage** (`src/pages/Index.tsx`)
1. **Primary Source**: Semantic Scholar (12 papers)
2. **Retry Logic**: 2 retries on failure
3. **CS-Focused Query**: "machine learning deep learning"
4. **More Papers**: Increased from 8 to 12

### **Publications Page** (`src/pages/Publications.tsx`)
1. **New Default Source**: Semantic Scholar
2. **New Source Option**: Added to dropdown
3. **CS-Focused Query**: "machine learning"
4. **Retry Logic**: 2 retries on failure

---

## 🎯 **Source Comparison**

| API | CS Focus | Quality | Speed | Citations | Venue | Best For |
|-----|----------|---------|-------|-----------|-------|----------|
| **Semantic Scholar** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ | ✅ | CS/AI papers |
| **arXiv** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ❌ | Latest preprints |
| **OpenAlex** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ | ❌ | Comprehensive data |
| **CrossRef** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | ❌ | Journal metadata |
| **CORE** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ❌ | ❌ | Open access |

**Recommendation**: Use **Semantic Scholar** as primary source for best CS/AI results!

---

## 📈 **Performance Optimizations**

1. **Caching**: 5-10 minute cache for API responses
2. **Retry Logic**: 2 automatic retries on failure
3. **Parallel Requests**: Multiple APIs fetched simultaneously
4. **Deduplication**: Removes duplicate papers by title
5. **Smart Sorting**: Citation count prioritization

---

## 🚀 **How to Use**

### **Homepage**
- Automatically loads 12 CS/AI/ML papers from Semantic Scholar
- Shows trending CS topics
- Displays CS-focused journals

### **Publications Page**
1. **Default**: Semantic Scholar with "machine learning" query
2. **Search**: Type any CS topic (e.g., "neural networks", "blockchain")
3. **Filter by Source**:
   - **Semantic Scholar** (Recommended) - Best CS papers with citations
   - **All Sources** - Combines Semantic Scholar, arXiv, OpenAlex
   - **arXiv** - Latest CS preprints
   - **OpenAlex** - Comprehensive research data

### **Journals Page**
- Searches for CS/AI journals from CrossRef
- Default query: "computer science artificial intelligence"

---

## 🎓 **For Your Presentation**

### **Key Talking Points**
1. **CS-Focused Platform**: "Built specifically for Computer Science, IT, and AI research"
2. **Best-in-Class APIs**: "Uses Semantic Scholar - the leading CS research API"
3. **Real Data**: "Live data from 200M+ research papers"
4. **Smart Features**: "Citation counts, venue info, duplicate removal"
5. **Quality Results**: "Automatically filters for CS-only content"

### **Demo Flow**
1. Show homepage with real CS/AI papers
2. Point out citation counts and venues
3. Search for "deep learning" on Publications page
4. Show Semantic Scholar results
5. Switch to "All Sources" to show aggregation
6. Highlight CS-specific trending topics

---

## 📝 **API Endpoints Used**

### **Semantic Scholar**
```
https://api.semanticscholar.org/graph/v1/paper/search
?query={query}
&fields=paperId,title,abstract,authors,year,citationCount,venue,externalIds,publicationDate,fieldsOfStudy
&limit=20
&fieldsOfStudy=Computer Science
```

### **arXiv (CS Only)**
```
http://export.arxiv.org/api/query
?search_query=all:{query}+AND+(cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CV+OR+cat:cs.CL+OR+cat:cs.NE+OR+cat:cs.IT+OR+cat:cs.CR)
&max_results=20
&sortBy=submittedDate
&sortOrder=descending
```

### **OpenAlex (CS Filtered)**
```
https://api.openalex.org/works
?search={query}
&filter=concepts.id:C41008148
&per-page=20
&sort=publication_date:desc
```

---

## ✅ **Verification Checklist**

- [x] Homepage loads CS/AI papers from Semantic Scholar
- [x] Publications page defaults to Semantic Scholar
- [x] All searches include CS context
- [x] Citation counts visible
- [x] Trending topics are CS-focused
- [x] Error handling works
- [x] Retry logic implemented
- [x] Duplicate removal working
- [x] Results sorted by citations

---

## 🎉 **Summary**

Your ResearchSphere platform is now:
- ✅ **100% CS/IT/AI focused**
- ✅ **Using the best APIs** (Semantic Scholar primary)
- ✅ **Showing real, high-quality data**
- ✅ **Displaying citation counts and venues**
- ✅ **Automatically filtering for CS content**
- ✅ **Perfect for your IT branch presentation!**

**The data quality is now significantly better** with Semantic Scholar providing:
- Verified CS/AI papers
- Citation metrics
- Venue information
- Author details
- Publication dates
- DOI links

**All APIs are free and require no authentication!**

---

*Updated: 2025-11-25*
*Focus: Computer Science, Information Technology, Artificial Intelligence*
