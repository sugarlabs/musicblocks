# musicblocks-electron

This is a repository for the electron-based offline version of [Music Blocks](https://github.com/sugarlabs/musicblocks).

## To Launch Locally

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository (--recursive is needed to pull the latest MB at the same time as a submodule)
git clone --recursive https://github.com/ukkari/musicblocks-electron
# Go into the repository
cd musicblocks-electron
# Install dependencies
yarn install
# Run the app
yarn start
```

## To Make Builds
```bash
# Make Win/macOS/Linux builds
yarn dist
```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.