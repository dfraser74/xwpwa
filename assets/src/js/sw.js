const sw_debug = true;
const sw_version = sw_debug ? 'dev' : 'prod';
importScripts( 'node_modules/workbox-sw/build/importScripts/workbox-sw.' + sw_version + '.v2.1.0.js' );

const workboxSW = new WorkboxSW();

const webfontsRegex = 'https://(fonts.googleapis.com|fonts.gstatic.com)/(.*)';
const localImagesRegex = '/(.*).(png|gif|jpg|jpeg)';
const cdnImagesRegex = 'https://i(0|1|2).wp.com/(.*)/';
const avatarsRegex = 'https://(.*).gravatar.com/(.*)/';

/*
	TODO: Use http://forbeslindesay.github.io/express-route-tester/ to only \
  TODO: cache pages outside of the /wp-admin.
  */
const htmlRegex = '/assets/html/(.*)';

/*
 1. Cache-Only (Precache)
 Used for the site's critical assets.
 The precache array gets filled by workbox-cli using the configuration inside workbox-cli-config.js.
  */
workboxSW.precache([]);

/*
 2. Cache First, Network Fallback
 Store in cache all external web fonts, if a regex is defined.
 */
if ( webfontsRegex ) {
	workboxSW.router.registerRoute( webfontsRegex ,
		workboxSW.strategies.cacheFirst( {
			cacheName: 'webfonts',
			cacheExpiration: {
				maxEntries: 20
			},
			cacheableResponse: { statuses: [0, 200] }
		})
	);
}

if ( localImagesRegex ) {
	workboxSW.router.registerRoute( localImagesRegex,
		workboxSW.strategies.cacheFirst({
			cacheName: 'images',
			cacheExpiration: {
				maxEntries: 100,
				maxAgeSeconds: 14 * 24 * 60 * 60
			}
		})
	);
}

if ( cdnImagesRegex ) {
	workboxSW.router.registerRoute( cdnImagesRegex ,
		workboxSW.strategies.cacheFirst( {
			cacheName: 'images',
			cacheExpiration: {
				maxEntries: 100,
				maxAgeSeconds: 14 * 24 * 60 * 60
			},
			cacheableResponse: { statuses: [0, 200] }
		} )
	);
}

/*
 3. Cache-Network race (Stale while Revalidate)
 Store in cache external assets which can change frequently, like avatars,
 which are non-essential to the user experience.
 */
if ( avatarsRegex ) {
	workboxSW.router.registerRoute( avatarsRegex ,
		workboxSW.strategies.staleWhileRevalidate( {
			cacheName: 'avatars',
			cacheExpiration: {
				maxEntries: 40
			},
			cacheableResponse: { statuses: [0, 200] }
		})
	);
}

/*
 4. Network First, Cache Fallback
 Store in cache content which always needs to be shown up-to-date.
 */
if ( htmlRegex ) {
	var htmlHandler = workboxSW.strategies.networkFirst({
		cacheName: 'html',
		cacheExpiration: {
			maxEntries: 50
		}
	});

	workboxSW.router.registerRoute( htmlRegex, args => {
		return htmlHandler.handle( args ).then( response => {
			if ( !response ) {
				return caches.match( 'assets/html/offline.html' );
			}
			if ( response.status === 404 ) {
				return caches.match( 'assets/html/404.html' );
			}
			return response;
		});
	});

}
