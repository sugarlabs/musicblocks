// var CACHE_NAME = 'music-blocks-site-precache';
// var urlsToCache = [
//     'index.html',
//     'loading-animation.gif',
//     'manifest.json',
//     'favicon.ico',

//     'header-icons/a-button.svg',
//     'header-icons/add.svg',
//     'header-icons/advanced-button.svg',
//     'header-icons/apply.svg',
//     'header-icons/b-button.svg',
//     'header-icons/beginner-button.svg',
//     'header-icons/bigger-button.svg',
//     'header-icons/bigger-disable-button.svg',
//     'header-icons/cancel-button.svg',
//     'header-icons/Cartesian-button.svg',
//     'header-icons/Cartesian-polar-button.svg',
//     'header-icons/clear-button.svg',
//     'header-icons/close-button.svg',
//     'header-icons/close-toolbar-button.svg',
//     'header-icons/collapse-blocks-button.svg',
//     'header-icons/copy-button.svg',
//     'header-icons/compile-button.svg',
//     'header-icons/delete.svg',
//     'header-icons/download-button.svg',
//     'header-icons/download-merge.svg',
//     'header-icons/download.svg',
//     'header-icons/down.svg',
//     'header-icons/edit.svg',
//     'header-icons/effects.svg',
//     'header-icons/empty-trash-confirm-button.svg',
//     'header-icons/new-button.svg',
//     'header-icons/new-project-button.svg',
//     'header-icons/envelope.svg',
//     'header-icons/erase-button.svg',
//     'header-icons/export-button.svg',
//     'header-icons/export-chunk.svg',
//     'header-icons/export-drums.svg',
//     'header-icons/fast-button.svg',
//     'header-icons/fast-mouse-button.svg',
//     'header-icons/fb-inactive.svg',
//     'header-icons/filter.svg',
//     'header-icons/filter+.svg',
//     'header-icons/folder-open.svg',
//     'header-icons/go-home-button.svg',
//     'header-icons/go-home-faded-button.svg',
//     'header-icons/grab-handle.svg',
//     'header-icons/grab.svg',
//     'header-icons/hard-stop-turtle-button.svg',
//     'header-icons/help-button.svg',
//     'header-icons/hide-blocks-button.svg',
//     'header-icons/hide.svg',
//     'header-icons/invert.svg',
//     'header-icons/language-button.svg',
//     'header-icons/lilypond-button.svg',
//     'header-icons/media-playback-pause-insensitive.svg',
//     'header-icons/media-playback-pause.svg',
//     'header-icons/media-playback-start-insensitive.svg',
//     'header-icons/media-playback-start.svg',
//     'header-icons/media-playlist-repeat-insensitive.svg',
//     'header-icons/media-playlist-repeat.svg',
//     'header-icons/menu-button.svg',
//     'header-icons/myblocks-button.svg',
//     'header-icons/new-project-button.svg',
//     'header-icons/next-button.svg',
//     'header-icons/no-grid-button.svg',
//     'header-icons/open-button.svg',
//     'header-icons/open-merge-button.svg',
//     'header-icons/optimize-off-button.svg',
//     'header-icons/optimize-on-button.svg',
//     'header-icons/open-toolbar-button.svg',
//     'header-icons/oscillator.svg',
//     'header-icons/palette-button.svg',
//     'header-icons/paste-button.svg',
//     'header-icons/paste-disabled-button.svg',
//     'header-icons/pause-button.svg',
//     'header-icons/planet-button.svg',
//     'header-icons/play-button.svg',
//     'header-icons/play-chord.svg',
//     'header-icons/play-scale.svg',
//     'header-icons/plugins-button.svg',
//     'header-icons/plugins-delete-button.svg',
//     'header-icons/plugins-delete-disabled-button.svg',
//     'header-icons/polar-button.svg',
//     'header-icons/popdown-palette-button.svg',
//     'header-icons/popout.svg',
//     'header-icons/publish.svg',
//     'header-icons/restore-button.svg',
//     'header-icons/restore-trash-button.svg',
//     'header-icons/rotate-left.svg',
//     'header-icons/rotate-right.svg',
//     'header-icons/run-button.svg',
//     'header-icons/samples-button.svg',
//     'header-icons/save-block-artwork_backup.svg',
//     'header-icons/save-block-artwork.svg',
//     'header-icons/save-blocks-button.svg',
//     'header-icons/save-button-dark.svg',
//     'header-icons/save-button.svg',
//     'header-icons/save-lilypond.svg',
//     'header-icons/save-png.svg',
//     'header-icons/save-svg.svg',
//     'header-icons/save-tb.svg',
//     'header-icons/save-to-file-button.svg',
//     'header-icons/save-wav.svg',
//     'header-icons/scroll-lock-button.svg',
//     'header-icons/scroll-unlock-button.svg',
//     'header-icons/search-button.svg',
//     'header-icons/share.svg',
//     'header-icons/show.svg',
//     'header-icons/slow-button.svg',
//     'header-icons/slow-music-button.svg',
//     'header-icons/smaller-button.svg',
//     'header-icons/smaller-disable-button.svg',
//     'header-icons/sort.svg',
//     'header-icons/stats-button.svg',
//     'header-icons/step-button.svg',
//     'header-icons/step-music-button.svg',
//     'header-icons/stop-button.svg',
//     'header-icons/stop-turtle-button.svg',
//     'header-icons/synth.svg',
//     'header-icons/tap-active-button.svg',
//     'header-icons/tap-button.svg',
//     'header-icons/turtle-button.svg',
//     'header-icons/upload-planet.svg',
//     'header-icons/up.svg',
//     'header-icons/utility-button.svg',

//     'images/8_bellset_key_1.svg',
//     'images/8_bellset_key_2.svg',
//     'images/8_bellset_key_3.svg',
//     'images/8_bellset_key_4.svg',
//     'images/8_bellset_key_5.svg',
//     'images/8_bellset_key_6.svg',
//     'images/8_bellset_key_7.svg',
//     'images/8_bellset_key_8.svg',
//     'images/bottle.svg',
//     'images/bubbles.svg',
//     'images/camera.svg',
//     'images/Cartesian.svg',
//     'images/cat.svg',
//     'images/chime.svg',
//     'images/clang.svg',
//     'images/clap.svg',
//     'images/close.svg',
//     'images/collapse.svg',
//     'images/cowbell.svg',
//     'images/crash.svg',
//     'images/cricket.svg',
//     'images/cup.svg',
//     'images/darbuka.svg',
//     'images/dog.svg',
//     'images/dupstack.svg',
//     'images/emptybox.svg',
//     'images/emptyheap.svg',
//     'images/emptystart.svg',
//     'images/expand.svg',
//     'images/fingercymbals.svg',
//     'images/floortom.svg',
//     'images/go-down.svg',
//     'images/go-up.svg',
//     'images/help-container.svg',
//     'images/hihat.svg',
//     'images/icons.svg',
//     'images/incompatible.svg',
//     'images/kick.svg',
//     'images/mouse2.svg',
//     'images/mouse.svg',
//     'images/negroot.svg',
//     'images/nocode.svg',
//     'images/noconnection.svg',
//     'images/nofile.svg',
//     'images/noinput.svg',
//     'images/nojournal.svg',
//     'images/nomedia.svg',
//     'images/nomicrophone.svg',
//     'images/nostack.svg',
//     'images/notanumber.svg',
//     'images/notastring.svg',
//     'images/overflowerror.svg',
//     'images/planetgraphic.png',
//     'images/polar.svg',
//     'images/ridebell.svg',
//     'images/slap.svg',
//     'images/snaredrum.svg',
//     'images/splash.svg',
//     'images/syntaxerror.svg',
//     'images/synth2.svg',
//     'images/synth.svg',
//     'images/tom.svg',
//     'images/trash.svg',
//     'images/trianglebell.svg',
//     'images/turtle2.svg',
//     'images/turtle.svg',
//     'images/video.svg',
//     'images/voices.svg',
//     'images/zerodivide.svg',

//     'lib/Chart.js',
//     'lib/domReady.js',
//     'lib/easeljs.min.js',
//     'lib/howler.js',
    
//     'lib/jquery-3.2.1.min.js', 
//     'lib/jquery-ui.js',
//     'lib/jquery-cookie.js',
//     'lib/jquery.ruler.js',
//     // 'lib/mespeak.js',
//     // 'lib/mespeak_config.json',
//     'lib/modernizr-2.6.2.min.js',
//     'lib/p5.dom.min.js',
//     'lib/p5.min.js',
//     'lib/p5.sound.min.js',
//     'lib/prefixfree.min.js',
//     'lib/preloadjs.min.js',    
//     'lib/require.js',
//     'lib/reqwest.js',
//     'lib/text.js',
//     'lib/Tone.js',
//     'lib/tweenjs.min.js',
//     'lib/voices/en/en.json',
//     'lib/webL10n.js',

//     'css/activity.css',

//     'js/abc.js',
//     'js/activity.js',
//     'js/rubrics.js',
//     'js/artwork.js',
//     'js/background.js',
//     'js/basicblocks.js',
//     'js/blockfactory.js',
//     'js/block.js',
//     'js/blocks.js',
//     'js/boundary.js',
//     'js/languagebox.js',
//     'js/lilypond.js',
//     'js/loader.js',
//     'js/logo.js',
//     'js/macros.js',
//     'js/palette.js',
//     'js/pastebox.js',
//     'js/playbackbox.js',
//     'js/pluginsviewer.js',
//     'js/protoblocks.js',
//     'js/SaveInterface.js',
//     'js/sugarizer-compatibility.js',
//     'js/toolbar.js',
//     'js/trash.js',
//     'js/turtledefs.js',
//     'js/turtle.js',

//     'js/widgets/modewidget.js',
//     'js/widgets/pitchdrummatrix.js',
//     'js/widgets/pitchslider.js',
//     'js/widgets/pitchstaircase.js',
//     'js/widgets/pitchtimematrix.js',
//     'js/widgets/rhythmruler.js',
//     'js/widgets/status.js',
//     'js/widgets/temperament.js',
//     'js/widgets/tempo.js',
//     'js/widgets/timbre.js',

//     'js/utils/detectIE.js',
//     'js/utils/munsell.js',
//     'js/utils/musicutils.js',
//     'js/utils/platformstyle.js',
//     'js/utils/synthutils.js',
//     'js/utils/utils.js',

//     'lib/sugar-web/env.js',
//     'lib/sugar-web/activity/activity.js',

//     'fonts/material-icons.css',
//     'fonts/material-icons.woff2',
//     'fonts/roboto/Roboto-Bold.woff',
//     'fonts/roboto/Roboto-Light.woff2',
//     'fonts/roboto/Roboto-Regular.woff',
//     'fonts/roboto/Roboto-Thin.woff2',
//     'fonts/roboto/Roboto-Bold.woff2',
//     'fonts/roboto/Roboto-Medium.woff',
//     'fonts/roboto/Roboto-Regular.woff2',
//     'fonts/roboto/Roboto-Light.woff',
//     'fonts/roboto/Roboto-Medium.woff2',
//     'fonts/roboto/Roboto-Thin.woff',
    
//     'planet/index.html',
//     'planet/css/style.css',
//     'planet/fonts/material-icons.css',
//     'planet/fonts/material-icons.woff2',
//     'planet/fonts/roboto/Roboto-Bold.woff',
//     'planet/fonts/roboto/Roboto-Light.woff2',
//     'planet/fonts/roboto/Roboto-Regular.woff',
//     'planet/fonts/roboto/Roboto-Thin.woff2',
//     'planet/fonts/roboto/Roboto-Bold.woff2',
//     'planet/fonts/roboto/Roboto-Medium.woff',
//     'planet/fonts/roboto/Roboto-Regular.woff2',
//     'planet/fonts/roboto/Roboto-Light.woff',
//     'planet/fonts/roboto/Roboto-Medium.woff2',
//     'planet/fonts/roboto/Roboto-Thin.woff',
//     'planet/images/mbgraphic.png',
//     'planet/images/tbgraphic.png',
//     'planet/js/Converter.js',
//     'planet/js/helper.js',
//     'planet/js/Planet.js',
//     'planet/js/SaveInterface.js',
//     'planet/js/GlobalCard.js',
//     'planet/js/LocalCard.js',
//     'planet/js/ProjectStorage.js',
//     'planet/js/ServerInterface.js',
//     'planet/js/GlobalPlanet.js',
//     'planet/js/LocalPlanet.js',
//     'planet/js/ProjectViewer.js',
//     'planet/js/GlobalTag.js',
//     'planet/js/main.js',
//     'planet/js/Publisher.js',
//     'planet/lib/jquery-3.2.1.min.js',
    
    
//     'lib/materialize.min.js',
//     'lib/materialize.min.css',
//     'lib/materialize-iso.css',
    

//     'sounds/samples/manifest.js'
// ];



// self.addEventListener('install', function(event) {
//   // Perform install steps
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then(function(cache) {
//         console.log('Opened cache');
//         return cache.addAll(urlsToCache);
//       })
//   );
// });



// This is the "Offline page" service worker

const CACHE = "pwabuilder-precache";
const precacheFiles = [
  /* Add an array of files to precache for your app */
    './index.html'
   

    ];

self.addEventListener("install", function (event) {
  console.log("[PWA Builder] Install Event processing");

  console.log("[PWA Builder] Skip waiting on install");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[PWA Builder] Caching pages during install");
      return cache.addAll(precacheFiles);
    })
  );
});

// Allow sw to control of current page
self.addEventListener("activate", function (event) {
  console.log("[PWA Builder] Claiming clients for current page");
  event.waitUntil(self.clients.claim());
});

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener("fetch", function (event) { 
  if (event.request.method !== "GET") return;

  event.respondWith(
    fromCache(event.request).then(
      function (response) {
        // The response was found in the cache so we responde with it and update the entry

        // This is where we call the server to get the newest version of the
        // file to use the next time we show view
        event.waitUntil(
          fetch(event.request).then(function (response) {
            return updateCache(event.request, response);
          })
        );

        return response;
      },
      function () {
        // The response was not found in the cache so we look for it on the server
        return fetch(event.request)
          .then(function (response) {
            // If request was success, add or update it in the cache
            event.waitUntil(updateCache(event.request, response.clone()));

            return response;
          })
          .catch(function (error) {
            console.log("[PWA Builder] Network request failed and no cache." + error);
          });
      }
    )
  );
});


function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        return Promise.reject("no-match");
      }

      return matching;
    });
  });
}

self.addEventListener('beforeinstallprompt', (event) => {
  console.log('👍', 'beforeinstallprompt', event);
  // Stash the event so it can be triggered later.
  window.deferredPrompt = event;
  // Remove the 'hidden' class from the install button container
  divInstall.classList.toggle('hidden', false);
});

function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}


// This is an event that can be fired from your page to tell the SW to update the offline page
self.addEventListener("refreshOffline", function () {
  const offlinePageRequest = new Request(offlineFallbackPage);

  return fetch(offlineFallbackPage).then(function (response) {
    return caches.open(CACHE).then(function (cache) {
      console.log("[PWA Builder] Offline page updated from refreshOffline event: " + response.url);
      return cache.put(offlinePageRequest, response);
    });
  });
});
















