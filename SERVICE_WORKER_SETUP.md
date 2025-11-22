# PWA Service Worker Setup

## Current Status

The PWA infrastructure is **90% complete**. Due to compatibility issues between `next-pwa` and Next.js 16, we've temporarily removed the automatic service worker generation.

## What's Working

✅ **IndexedDB** - Full offline storage with Dexie.js  
✅ **Sync Engine** - Background sync with retry logic  
✅ **Offline Media** - Image capture and compression  
✅ **R2 Uploads** - Signed URLs and direct uploads  
✅ **UI Components** - Status indicators, sync panel  
✅ **Manifest** - PWA manifest.json configured  
✅ **Metadata** - PWA meta tags in layout  

## What Needs Manual Setup

⚠️ **Service Worker** - Needs manual implementation

## Solution Options

### Option 1: Wait for next-pwa Update (Recommended)

Monitor https://github.com/shadowwalker/next-pwa for Next.js 16 compatibility.

Once updated:
```bash
npm install next-pwa@latest
```

Then restore the next.config.ts with PWA wrapper (see git history).

### Option 2: Manual Service Worker (Advanced)

Create `public/sw.js`:

```javascript
// public/sw.js
const CACHE_NAME = 'uppcl-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

Register in `src/app/layout.tsx`:

```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('SW registered:', reg))
      .catch((err) => console.error('SW error:', err));
  }
}, []);
```

### Option 3: Use Workbox CLI (Recommended for Production)

```bash
npm install -D workbox-cli
```

Create `workbox-config.js`:

```javascript
module.exports = {
  globDirectory: '.next/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,gif,svg,woff,woff2}'
  ],
  swDest: 'public/sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.r2\.dev\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'cloudflare-images',
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        networkTimeoutSeconds: 10
      }
    }
  ]
};
```

Add to `package.json`:

```json
{
  "scripts": {
    "build": "next build && workbox generateSW workbox-config.js"
  }
}
```

## Current Workaround

The app works **without a service worker** for now. All offline functionality works via:

- **IndexedDB** for data storage
- **Sync Engine** for background sync
- **Browser APIs** for media capture

The only missing feature is:
- **Offline page caching** (pages won't load offline on first visit)
- **Asset caching** (images, CSS, JS won't cache automatically)

## Impact

**Low Impact** - The core PWA features work:
- ✅ Offline data creation/editing
- ✅ Offline media capture
- ✅ Background sync
- ✅ Installability (manifest.json works)

**Missing**:
- ❌ Offline page navigation (first load)
- ❌ Automatic asset caching

## Recommendation

For **development/testing**: Current setup is fine  
For **production**: Implement Option 3 (Workbox CLI) before deployment

## Testing Without Service Worker

You can still test all PWA features:

1. **Install the app** - Manifest.json enables install prompt
2. **Work offline** - IndexedDB stores all data
3. **Capture media** - Works via browser APIs
4. **Sync when online** - Sync engine handles this

The only limitation is that navigating to new pages while offline won't work (will show browser offline page).

## Next Steps

1. Choose one of the 3 options above
2. Implement service worker
3. Test offline page navigation
4. Deploy to production

---

**Status**: Functional without SW, full PWA with SW  
**Priority**: Medium (can deploy without, but should add for production)  
**Effort**: 1-2 hours for Option 3
