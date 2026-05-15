# Developing Music Blocks in a Dev Container

This repository includes a [Dev Container](https://containers.dev/) configuration that provides a fully configured, isolated development environment with zero manual setup.

## Prerequisites

- [Docker](https://www.docker.com/get-started) (or Docker Desktop)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code

## Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/sugarlabs/musicblocks.git
   cd musicblocks
   ```

2. **Open in VS Code**

   ```bash
   code .
   ```

3. **Reopen in Container**

   When VS Code detects the `.devcontainer/devcontainer.json`, it will prompt you with:

   > *"Folder contains a Dev Container configuration file. Reopen folder to develop in a container?"*

   Click **"Reopen in Container"**.

   Alternatively, open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

   ```
   Dev Containers: Reopen in Container
   ```

4. **Wait for setup**

   VS Code will:
   - Pull the Node.js 20 container image
   - Install project dependencies via `npm install`
   - Install recommended extensions (ESLint, Prettier)
   - Forward port `3000` automatically

   This may take 2–5 minutes on first run.

5. **Start the development server**

   Once inside the container, open a terminal in VS Code and run:

   ```bash
   npm run dev
   ```

6. **Open in browser**

   Visit [http://localhost:3000](http://localhost:3000).

   VS Code will also show a notification with an **"Open in Browser"** button when the port forwards.

## What's Included

| Feature | Details |
|---------|---------|
| **Base Image** | `mcr.microsoft.com/devcontainers/javascript-node:20` |
| **Node Version** | 20 (LTS) |
| **Pre-installed Tools** | `git`, `npm`, `node` |
| **VS Code Extensions** | ESLint, Prettier, JSON support |
| **Port Forwarding** | `3000` → Music Blocks Dev Server |
| **Post-create Hook** | `npm install` runs automatically |

## Common Tasks

### Run tests

```bash
npm test
```

### Run linter

```bash
npm run lint
```

### Check formatting

```bash
npx prettier --check .
```

### Format all files

```bash
npx prettier --write .
```

## Troubleshooting

### Port 3000 is already in use

If you see `EADDRINUSE :::3000`, another process is using port 3000.

- **Host machine**: Stop any local `npm run dev` or Docker container running outside the dev container.
- **Inside dev container**: Run `npm run dev` on a different port:
  ```bash
  npm run dev -- --port 3001
  ```

### Changes to `devcontainer.json` not applied

After editing `.devcontainer/devcontainer.json`, rebuild the container:

1. Open Command Palette
2. Run `Dev Containers: Rebuild Container`

### Slow performance on first start

The initial build downloads the Node.js image and runs `npm install`. Subsequent starts are near-instant because VS Code reuses the container.

### Files appear owned by `root`

The dev container runs as the `node` user by default. If you create files outside the container (e.g., via host terminal), they may have different ownership. Fix with:

```bash
sudo chown -R $(whoami) .
```

## Exiting the Dev Container

- **Close VS Code** — the container stops automatically.
- **Reopen locally** — Command Palette → `Dev Containers: Reopen Folder Locally`.

The container and your changes persist. When you reopen the project later, VS Code reconnects to the same container instantly.

## References

- [Dev Container specification](https://containers.dev/implementors/json_reference/)
- [VS Code Dev Containers documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Music Blocks CONTRIBUTING guide](../CONTRIBUTING.md)
