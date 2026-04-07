# Developer Troubleshooting

This document contains developer-focused troubleshooting guidance for building,
running, and contributing to Music Blocks. End users should refer to the main
README and user documentation.

## Browser Shows Blank Page or Blocks Not Displaying

Problem:
The application loads but shows a blank screen or blocks do not appear.

Solution:
1. Open the browser Developer Tools.
   - Chrome / Edge: F12 or Ctrl + Shift + J
   - Firefox: Ctrl + Shift + K
2. Check the Console tab for JavaScript errors.
3. Fix the reported errors and reload the page.
4. Try running the app in Chrome or Firefox if the issue persists.

## npm install Fails with Permission Errors

Problem:
Dependency installation fails due to permission issues or corrupted files.

Solution:
Run the following commands from the project root:

rm -rf node_modules package-lock.json  
npm install

On Windows, use PowerShell or Git Bash.

## npm run lint Fails with Formatting Errors

Problem:
Linting errors block the build due to formatting issues.

Solution:
Run Prettier first, then re-run lint:

npx prettier --write .  
npm run lint

## Docker Container Won’t Start

Problem:
Docker build fails or the container does not start correctly.

Solution:
Clean Docker state and rebuild:

docker system prune  
docker-compose up --build

## Port Already in Use (EADDRINUSE)

Problem:
The development server fails to start because port 3000 is already in use.

Solution:
Start the server on a different port:

PORT=3001 npm start

Or for development mode:

PORT=3001 npm run dev

Then open http://localhost:3001 in your browser.

## No Sound / Audio Not Working

Problem:
The application runs but produces no sound.

Solution:
1. Ensure system volume is not muted.
2. Check browser audio permissions.
3. Click once anywhere on the page to enable audio playback.
4. Use a supported browser (Chrome or Firefox recommended).

## Module Not Found Errors

Problem:
Errors such as "Cannot find module" appear during runtime or build.

Solution:
Reinstall dependencies:

rm -rf node_modules package-lock.json  
npm install

## Still Having Issues?

If problems persist:
1. Search existing GitHub issues:
   https://github.com/sugarlabs/musicblocks/issues
2. Review developer documentation.
3. Open a new issue with:
   - Error logs
   - Steps to reproduce
   - Browser and OS details
