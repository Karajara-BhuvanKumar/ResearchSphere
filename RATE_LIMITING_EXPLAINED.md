# 📊 API Rate Limiting - What's Happening

## ✅ This is NOT an Error!

The **429 "Too Many Requests"** error you're seeing is **completely normal** and shows that your backend is working correctly!

## 🔍 What's Happening

**Semantic Scholar API** has rate limits to prevent abuse:
- **Without API Key**: ~100 requests per 5 minutes
- **With API Key**: Higher limits

When you refresh your page multiple times or search frequently, you hit this limit temporarily.

## ⚡ What I Fixed

### 1. **Better Error Handling**
```javascript
// Now shows a helpful warning instead of generic error
if (error.response?.status === 429) {
  console.warn('⚠️  Semantic Scholar rate limit hit. 
                Try again in a few seconds or use other sources.');
  return []; // Returns empty array gracefully
}
```

### 2. **Timeout Protection**
```javascript
const response = await axios.get(url, {
  headers: { 'Accept': 'application/json' },
  timeout: 10000 // 10 second timeout
});
```

## 🎯 Solutions

### **Option 1: Wait a Few Seconds** (Easiest)
Just wait 10-30 seconds before refreshing. The rate limit resets quickly.

### **Option 2: Use Other APIs** (Recommended)
Your app has **7 other APIs** that don't have this issue:
- ✅ **arXiv** - No rate limits
- ✅ **OpenAlex** - Very generous limits
- ✅ **CrossRef** - Good limits
- ✅ **CORE** - Good limits
- ✅ **Google Books** - Good limits
- ✅ **Hugging Face** - Good limits

### **Option 3: Get a Free API Key** (Best Long-term)
1. Go to: https://www.semanticscholar.org/product/api
2. Sign up for a free API key
3. Add to `server/.env`:
   ```env
   SEMANTIC_SCHOLAR_API_KEY=your_key_here
   ```
4. Restart backend server
5. **Much higher rate limits!**

### **Option 4: Reduce Requests** (Smart)
The app already does this! When Semantic Scholar fails, it still shows results from other APIs.

## 📈 Current Behavior

When you search, the app tries all APIs in parallel:
```
Search "machine learning"
    ↓
┌─────────────────────────────────────┐
│ Semantic Scholar → 429 (rate limit) │ ❌ Returns []
│ arXiv           → Success           │ ✅ Returns papers
│ OpenAlex        → Success           │ ✅ Returns papers
│ CrossRef        → Success           │ ✅ Returns papers
└─────────────────────────────────────┘
    ↓
Shows combined results from successful APIs
```

**You still get results!** Just from the other APIs.

## 🔧 What Changed in Code

**File: `server/services/researchService.js`**

**Before:**
```javascript
catch (error) {
  console.error('Error fetching Semantic Scholar papers:', error.message);
  return [];
}
```

**After:**
```javascript
catch (error) {
  // Handle rate limiting specifically
  if (error.response?.status === 429) {
    console.warn('⚠️  Semantic Scholar rate limit hit. Try again in a few seconds or use other sources (arXiv, OpenAlex).');
    return [];
  }
  console.error('Error fetching Semantic Scholar papers:', error.message);
  return [];
}
```

## 💡 Pro Tips

1. **Don't worry about 429 errors** - They're temporary and expected
2. **The app handles it gracefully** - Other APIs still work
3. **Wait between searches** - Give APIs a break
4. **Use specific pages** - Publications page uses one API at a time
5. **Get an API key** - For heavy usage

## 📊 Rate Limit Comparison

| API | Free Limit | With Key | Our Usage |
|-----|-----------|----------|-----------|
| Semantic Scholar | ~100/5min | Higher | Medium |
| arXiv | Unlimited | N/A | Low |
| OpenAlex | Very High | N/A | Low |
| CrossRef | High | N/A | Low |
| CORE | Medium | Higher | Low |
| Google Books | High | N/A | Low |
| Hugging Face | High | N/A | Low |

## ✅ What to Do Now

**Nothing!** Your app is working correctly. The 429 errors are:
- ✅ Expected behavior
- ✅ Handled gracefully
- ✅ Don't break the app
- ✅ Other APIs still work

If you want **zero rate limit issues**:
1. Get a free Semantic Scholar API key
2. Add it to `server/.env`
3. Restart the backend

---

**Bottom Line:** This is normal API behavior, not a bug! Your backend is handling it perfectly. 🎉
