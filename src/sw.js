const VERSION = '1.0'
const CACHE_VERSION = 'd.tube-pwa-' + VERSION

const cachableItems = [
    '/',
    '/styles/base.css',
    '/styles/fonts/icons.woff2',
    '/scripts/app.js',
    '/images/DTube_Black.svg',
    '/images/DTube_White.svg',
    '/icons/dtubefavicon.png'
]

// SW installation

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_VERSION))
        .then(cache => {
            return cache.addAll(cachableItems)
        })
        .then(() => {
            return self.skipWaiting()
        })
})

// SW activation

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if(CACHE_VERSION !== cacheName){
                            return caches.delete(cacheName)
                        }
                    })
                )
            })
    )
})