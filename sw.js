self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open('beatup-v1').then(c=>c.addAll([
    './','./index.html','./styles.css','./main.js',
    './engine/math.js','./engine/input.js','./engine/loop.js','./engine/physics.js','./engine/stats.js','./engine/storage.js','./engine/ai.js',
    './manifest.json','./assets/icon-192.png','./assets/icon-512.png'
  ])));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k==='beatup-v1'?null:caches.delete(k)))));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)));
});