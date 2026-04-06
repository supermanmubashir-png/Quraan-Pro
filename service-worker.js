const CACHE="quran-pro-v5";

self.addEventListener("install",e=>{
 e.waitUntil(caches.open(CACHE).then(c=>c.addAll([
  "./","./index.html","./icon.png"
 ])));
});

self.addEventListener("activate",e=>{
 e.waitUntil(caches.keys().then(keys=>{
  return Promise.all(keys.map(k=>{
   if(k!==CACHE) return caches.delete(k);
  }));
 }));
});

self.addEventListener("fetch",e=>{
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
