# Favicon Optimization Guide

The current favicon uses the full logo, which can look cramped at small sizes (16x16, 32x32 pixels).

## Recommended Solution

Create a simplified favicon that focuses on just the Poké Ball icon portion of your logo. This will be much more visible and recognizable at small sizes.

### Steps to Create an Optimized Favicon:

1. **Extract the Poké Ball Icon**
   - Open your logo.png in an image editor
   - Crop to just the Poké Ball icon (remove the text)
   - The icon should be square or nearly square

2. **Create Multiple Sizes**
   - **favicon-16x16.png** - 16x16 pixels (for browser tabs)
   - **favicon-32x32.png** - 32x32 pixels (for browser tabs and bookmarks)
   - **favicon-64x64.png** - 64x64 pixels (for high-DPI displays)
   - **apple-touch-icon.png** - 180x180 pixels (for iOS home screen)

3. **Optimize the Images**
   - Use a tool like TinyPNG or ImageOptim to compress
   - Ensure transparency is preserved
   - Keep file sizes small (< 10KB each)

4. **Update index.html**
   Replace the favicon links with:
   ```html
   <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
   <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
   <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64x64.png" />
   <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
   ```

5. **Place Files in Public Folder**
   - Put all favicon files in `/public/` directory
   - They will be served at the root URL

### Quick Fix (Current Setup)

If you want a quick improvement without creating new files, you can:
- Use an online favicon generator (like favicon.io or realfavicongenerator.net)
- Upload your logo and it will generate optimized favicons
- Download and place them in the `/public/` folder

### Alternative: SVG Favicon

For the best scalability, consider creating an SVG favicon:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

SVG favicons scale perfectly at any size and are supported by modern browsers.
