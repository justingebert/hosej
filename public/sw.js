if(!self.define){let e,s={};const n=(n,a)=>(n=new URL(n+".js",a).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(a,t)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(s[i])return;let c={};const r=e=>n(e,i),o={module:{uri:i},exports:c,require:r};s[i]=Promise.all(a.map((e=>o[e]||r(e)))).then((e=>(t(...e),c)))}}define(["./workbox-c06b064f"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/64wnj5e5LkAwQI8r7yodV/_buildManifest.js",revision:"e0a21c7d7f93d89dce16df0231dc76f2"},{url:"/_next/static/64wnj5e5LkAwQI8r7yodV/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/17-02a1be02417fa812.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/250-254236b5966a5aa0.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/468-e9ad8d49258a47e6.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/833-62dbd46f19e0328c.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/app/_not-found-638f7edb321874e6.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/app/dashboard/create/page-a4dc54ba50c442fc.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/app/dashboard/daily/page-cea2bd3c750db693.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/app/dashboard/daily/resultsdetailed/%5Bid%5D/page-495a34164f38b88d.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/app/layout-b6e6ddee0a3e100d.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/app/page-0a7d17b394bbc2d2.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/app/signin/page-6a815995da959b64.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/fd9d1056-f1d828435d4aa189.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/framework-aec844d2ccbe7592.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/main-7278c30bcb2148e6.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/main-app-0bcaddf164514927.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/pages/_app-75f6107b0260711c.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/pages/_error-9a890acb1e81c3fc.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js",revision:"837c0df77fd5009c9e46d446188ecfd0"},{url:"/_next/static/chunks/webpack-b9caf0a0e9009123.js",revision:"64wnj5e5LkAwQI8r7yodV"},{url:"/_next/static/css/f98d652f25b40937.css",revision:"f98d652f25b40937"},{url:"/appicon.jpg",revision:"a42f5e77170835b17d75e1fa31ccb12c"},{url:"/icon.png",revision:"665542205d6bec10c77eee67cbeea4be"},{url:"/manifest.json",revision:"131c98fb660d34c9221c2dd6942afbfe"}],{ignoreURLParametersMatching:[/^utm_/,/^fbclid$/]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({response:e})=>e&&"opaqueredirect"===e.type?new Response(e.body,{status:200,statusText:"OK",headers:e.headers}):e}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:2592e3})]}),"GET"),e.registerRoute(/\/_next\/static.+\.js$/i,new e.CacheFirst({cacheName:"next-static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4|webm)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:48,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({sameOrigin:e,url:{pathname:s}})=>!(!e||s.startsWith("/api/auth/callback")||!s.startsWith("/api/"))),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({request:e,url:{pathname:s},sameOrigin:n})=>"1"===e.headers.get("RSC")&&"1"===e.headers.get("Next-Router-Prefetch")&&n&&!s.startsWith("/api/")),new e.NetworkFirst({cacheName:"pages-rsc-prefetch",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({request:e,url:{pathname:s},sameOrigin:n})=>"1"===e.headers.get("RSC")&&n&&!s.startsWith("/api/")),new e.NetworkFirst({cacheName:"pages-rsc",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:{pathname:e},sameOrigin:s})=>s&&!e.startsWith("/api/")),new e.NetworkFirst({cacheName:"pages",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({sameOrigin:e})=>!e),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
