Cleanup performed:

- Replaced local jQuery 2.1.4 include in `index.html` with CDN-hosted jQuery 3.7.1.
- Updated `manifest.json`, `android_chrome_manifest.json`, and `manifest.webapp` to reference `activity/activity-icon-color-512.png` as the canonical icon.

Recommended manual removals (files present in repo):
- lib/jquery-2.1.4.js
- lib/jquery-2.1.4.min.js
- activity/activity-icon-color-0-75.png
- activity/activity-icon-color-1-00.png
- activity/activity-icon-color-1-50.png
- activity/activity-icon-color-2-00.png
- activity/activity-icon-color-3-00.png
- activity/activity-icon-color-4-00.png
- activity/activity-icon-maskable.png

Notes:
- I couldn't remove binary files via the automated patch tool in this session; please delete them via git or your file manager and commit.
- After removing files, run a quick smoke test: open `index.html` in a browser and ensure the app loads and console shows no jQuery-related errors.
- For full dependency updates, consider running `npm outdated` and upgrading packages in `package.json`, testing each change.
