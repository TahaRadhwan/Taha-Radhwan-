/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_VERSION = 'taha-radhwan-v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// الأصول الثابتة الأساسية التي يجب تخزينها مسبقاً أثناء التثبيت (Pre-caching)
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo_icon_1784393762345.jpg'
];

// تثبيت ملف تعريف الارتباط وجلب الأصول الثابتة المحددة سلفاً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Pre-caching Core App Shell');
      return cache.addAll(PRE_CACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// تفعيل ملف الخدمة وحذف جميع الكاشات القديمة التابعة للإصدارات السابقة
self.addEventListener('activate', (event) => {
  const activeCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!activeCaches.includes(cacheName)) {
            console.log(`[Service Worker] Deleting outdated cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// إدارة واستجابة الطلبات باستراتيجيات ذكية ومتقدمة (Cache-First / Network-First)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. عدم كشط أو تخزين طلبات قواعد البيانات الحية وطلبات Firebase ومصادقة المستخدم
  if (
    url.pathname.includes('/api/') || 
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    return; // دع الشبكة تتعامل معها مباشرة للتأكد من المزامنة اللحظية
  }

  // 2. استراتيجية "Cache-First" للملفات الثابتة والصور والخطوط (حيث لا تتغير باستمرار)
  const isStaticAsset = 
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf');

  const isImage = 
    request.destination === 'image' ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.webp');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // إرجاع كاش احتياطي عام إذا لزم الأمر
        });
      })
    );
    return;
  }

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. استراتيجية "Network-First" لطلبات الملاحة وتحديثات الصفحات (Navigation)
  // تضمن هذه الاستراتيجية جلب أحدث كود للتطبيق إذا كانت الشبكة متصلة، مع التحول الفوري للكاش عند انقطاعها
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // في حال انقطاع الشبكة، يتم التحميل مباشرة من كاش الصفحة الرئيسية
        return caches.match('/').then((fallback) => {
          if (fallback) return fallback;
          return caches.match('/index.html');
        });
      })
    );
    return;
  }

  // 4. الاستراتيجية الافتراضية لبقية الطلبات (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // تجاهل أخطاء الشبكة أثناء التحديث الخلفي
      });

      return cachedResponse || fetchPromise;
    })
  );
});

