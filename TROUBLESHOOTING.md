Having trouble getting Music Blocks to run? Here are solutions to common
problems:

### Port 3000 is Already in Use

**Problem:** You get an error like `Port 3000 is already in use` or `EADDRINUSE`

**Solution:**

**Option 1:** Kill the process using port 3000

-   **On Windows (PowerShell):**
    ```powershell
    Get-NetTCPConnection -LocalPort 3000 | Stop-Process -Force
    ```

-   **On macOS/Linux:**
    ```bash
    lsof -ti:3000 | xargs kill -9
    ```

**Option 2:** Use a different port

```bash
npm run dev -- --port 3001
```

Then visit `http://localhost:3001`

### npm install Fails with Permission Errors

**Problem:** Error like `EACCES: permission denied`

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Install with legacy peer deps flag
npm install --legacy-peer-deps
```

**For macOS/Linux users:**
```bash
# Avoid using sudo. Instead, fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Browser Shows Blank Page or Blocks Not Displaying

**Problem:** You can access `localhost:3000` but the page is blank or blocks
don't load

**Solutions:**

1. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on macOS)
   - Clear browsing data and refresh the page

2. **Try a different browser:**
   - Chrome/Chromium, Firefox, Safari, and Edge all work well
   - Avoid Internet Explorer
            
3. **Check browser console for errors:**
   - Press `F12` or `Ctrl+Shift+J` to open Developer Tools
   - Look for red error messages in the Console tab
   - Report any errors in the [issues tab](https://github.com/sugarlabs/musicblocks/issues)

4. **Ensure JavaScript is enabled:**
   - Most modern browsers have JavaScript enabled by default
   - Check your browser settings if blocks still don't appear

### No Sound/Audio Not Working

**Problem:** Music Blocks runs but produces no sound

**Solutions:**

1. **Check system volume:**
   - Ensure your system volume is not muted
   - Check that speakers/headphones are connected and working

2. **Browser permissions:**
   - Some browsers require permission to access audio
   - Look for permission prompts in your browser

3. **Audio context issue:**
   - Try refreshing the page
   - Close and reopen the browser tab

4. **Check browser console:**
   - Press `F12` and look for audio-related errors
   - Report any errors to the [issues tab](https://github.com/sugarlabs/musicblocks/issues)

### Docker Container Won't Start

**Problem:** `docker run` command fails or container exits immediately

**Solutions:**

1. **Check if Docker is running:**
   ```powershell
   docker ps
   ```
   If this fails, start Docker Desktop

2. **Rebuild the image:**
   ```bash
   docker build -t musicblocks .
   docker run -p 3000:3000 musicblocks
   ```

3. **Check logs:**
   ```bash
   docker logs musicblocks
   ```

### npm run lint Fails with Formatting Errors

**Problem:** ESLint shows "Forgot to run Prettier?" error

**Solution:**

Run Prettier to auto-format your files:

```bash
npx prettier --write .
```

Then run lint again:

```bash
npm run lint
```

### Application Runs Slowly or Freezes

**Problem:** Music Blocks feels sluggish or unresponsive

**Solutions:**

1. **Close unnecessary browser tabs** - Free up memory
2. **Clear browser cache** - Removes old cached files
3. **Use a different browser** - Some browsers handle large projects better
4. **Reduce the complexity** - Fewer blocks and lower animation complexity
5. **Check system resources** - Ensure your computer has enough RAM and CPU available

### Module Not Found Errors

**Problem:** Error like `Cannot find module 'xyz'`

**Solution:**

```bash
# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
```

On Windows (PowerShell):
```powershell
Remove-Item -Recurse node_modules
Remove-Item package-lock.json
npm install
```

### Still Having Issues?

If you've tried the solutions above and still need help:

1. **Check the [Docs](./Docs/documentation/README.md)** for detailed feature documentation
2. **Search [existing issues](https://github.com/sugarlabs/musicblocks/issues)** - your problem might already be solved
3. **Open a new issue** - Include:
   - Your operating system (Windows/macOS/Linux)
   - Browser and version
   - Steps to reproduce the problem
   - Browser console errors (Press F12 and check the Console tab)
