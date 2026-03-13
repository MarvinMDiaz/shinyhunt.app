# Fixing Favicon in Google Search Results

## Problem
Google Search Results are showing a generic grey cube icon instead of your custom favicon.

## Solution

Google requires a `favicon.ico` file at the root of your website for search results. Here's how to fix it:

### Step 1: Create favicon.ico

You have two options:

**Option A: Convert existing PNG to ICO**
1. Use an online converter like https://convertio.co/png-ico/ or https://favicon.io/favicon-converter/
2. Upload `public/favicon-32-165.png`
3. Download the converted `favicon.ico`
4. Place it in `public/favicon.ico`

**Option B: Copy PNG as ICO (temporary)**
```bash
cd public
cp favicon-32-165.png favicon.ico
```

Note: Modern browsers support PNG as favicon, but Google Search specifically looks for `.ico` format.

### Step 2: Verify File Location

Make sure `favicon.ico` is accessible at:
```
https://www.shinyhunt.app/favicon.ico
```

### Step 3: Update HTML (Already Done)

The `index.html` has been updated to include:
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
```

### Step 4: Request Re-indexing in Google Search Console

1. Go to Google Search Console
2. Use the URL Inspection tool
3. Enter: `https://www.shinyhunt.app/`
4. Click "Request Indexing"

### Step 5: Wait

- Google can take **days to weeks** to update favicons in search results
- This is normal - Google caches favicons for performance
- Your favicon should appear in browser tabs immediately
- Search results may take longer

## Current Favicon Files

- ✅ `public/favicon-32-165.png` (32x32 PNG)
- ✅ `public/favicon-165.png` (512x512 PNG)
- ⚠️ `public/favicon.ico` (needs to be created)

## Testing

After creating `favicon.ico`, test it:
1. Visit `https://www.shinyhunt.app/favicon.ico` directly
2. Check browser tab - should show your favicon
3. Wait for Google to re-crawl (can take days)

## Additional Notes

- Google prefers square favicons (16x16, 32x32, or 48x48 pixels)
- The favicon should be simple and recognizable at small sizes
- Make sure the file is accessible (not blocked by robots.txt or server config)
