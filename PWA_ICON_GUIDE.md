# PWA Icon Generation Guide

## Required Icons

The PWA requires the following icons in the `public` directory:

1. **icon-192x192.png** - 192x192 pixels
2. **icon-512x512.png** - 512x512 pixels
3. **screenshot-mobile.png** - 540x720 pixels (optional, for app store listing)

## Design Specifications

### Icon Design
- **Background**: Blue gradient (#3b82f6 to #1e40af)
- **Icon**: White clipboard with checkmarks and progress chart
- **Style**: Flat, minimalist, modern
- **Format**: PNG with transparency
- **Purpose**: Represents progress tracking functionality

### Recommended Tools

#### Online Tools (Free)
1. **Canva** - https://www.canva.com
   - Use "Custom Size" template
   - 512x512px for main icon
   - Export as PNG

2. **Figma** - https://www.figma.com
   - Create 512x512px frame
   - Design icon
   - Export as PNG

3. **PWA Asset Generator** - https://www.pwabuilder.com/imageGenerator
   - Upload a 512x512px icon
   - Generates all required sizes

#### Command Line (ImageMagick)

If you have a 512x512px icon, resize it:

```bash
# Install ImageMagick first
# On Windows: choco install imagemagick
# On Mac: brew install imagemagick
# On Linux: sudo apt-get install imagemagick

# Resize to 192x192
magick icon-512x512.png -resize 192x192 icon-192x192.png
```

## Quick Placeholder Icons

For development/testing, you can use simple colored squares:

### Using HTML Canvas (Browser Console)

```javascript
// Create 512x512 icon
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const ctx = canvas.getContext('2d');

// Gradient background
const gradient = ctx.createLinearGradient(0, 0, 512, 512);
gradient.addColorStop(0, '#3b82f6');
gradient.addColorStop(1, '#1e40af');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 512, 512);

// White text
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 120px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('UPPCL', 256, 256);

// Download
canvas.toBlob(blob => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'icon-512x512.png';
  a.click();
});
```

### Using Online Icon Generator

1. Go to https://favicon.io/favicon-generator/
2. Enter "UPPCL" as text
3. Choose blue background (#3b82f6)
4. Download and extract
5. Rename files to match requirements

## Installation

Once you have the icons:

1. Place them in the `public` directory:
   ```
   public/
   ├── icon-192x192.png
   ├── icon-512x512.png
   └── screenshot-mobile.png (optional)
   ```

2. The manifest.json already references these files
3. Rebuild the app: `npm run build`
4. Test the PWA install prompt

## Verification

To verify icons are working:

1. Open DevTools (F12)
2. Go to Application tab
3. Click "Manifest" in sidebar
4. Check "Icons" section
5. Icons should show with correct sizes

## Current Status

⚠️ **Icons not yet generated** - The app will work without icons, but the install prompt may not appear on some devices.

## Next Steps

1. Generate or design the 512x512px icon
2. Resize to 192x192px
3. Place in `public` directory
4. Test PWA installation
