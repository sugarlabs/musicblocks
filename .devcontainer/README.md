# Developing Music Blocks in a Containerized Environment

This repository includes a containerized development environment compatible with:

- VS Code Dev Containers
- GitHub Codespaces
- Standard Docker workflows

The setup provides a consistent Node.js development environment with minimal manual configuration.

---

# Prerequisites

Depending on your workflow, you may need:

- [Docker](https://www.docker.com/get-started) or Docker Desktop
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) for VS Code
- A GitHub account (for Codespaces)

---

# Option 1 — VS Code Dev Containers

Recommended for local development with full IDE integration.

## 1. Clone the repository

```bash
git clone https://github.com/sugarlabs/musicblocks.git
cd musicblocks
```

## 2. Open in VS Code

```bash
code .
```

## 3. Reopen in Container

When VS Code detects `.devcontainer/devcontainer.json`, it will show a prompt:

> "Folder contains a Dev Container configuration file. Reopen folder to develop in a container?"

Click:

```text
Reopen in Container
```

Alternatively:

1. Open the Command Palette:
   - Linux/Windows: `Ctrl+Shift+P`
   - macOS: `Cmd+Shift+P`

2. Run:

```text
Dev Containers: Reopen in Container
```

## 4. Wait for setup

VS Code will automatically:

- Pull the Node.js 20 container image
- Install dependencies using `npm install`
- Install recommended extensions
- Forward port `3000`

The initial setup may take a few minutes.

## 5. Start the development server

Open a terminal inside the container and run:

```bash
npm run dev
```

## 6. Open in browser

Visit:

```text
http://localhost:3000
```

VS Code may also show an **Open in Browser** notification automatically.

---

# Option 2 — GitHub Codespaces

You can develop entirely in the browser using GitHub Codespaces.

## 1. Open the repository on GitHub

Go to:

```text
https://github.com/sugarlabs/musicblocks
```

## 2. Create a Codespace

Click:

```text
Code → Codespaces → Create codespace on main
```

GitHub will automatically use the `.devcontainer` configuration.

## 3. Wait for environment setup

Codespaces will:

- Build the development container
- Install dependencies
- Configure the editor environment
- Expose port `3000`

## 4. Start the development server

Open the integrated terminal and run:

```bash
npm run dev
```

## 5. Open the forwarded port

Codespaces will automatically provide a browser preview for port `3000`.

---

# Option 3 — Docker (Without VS Code)

This option is useful for developers who prefer terminal-based workflows or editors other than VS Code.

## 1. Clone the repository

```bash
git clone https://github.com/sugarlabs/musicblocks.git
cd musicblocks
```

## 2. Start a development container

Run:

```bash
docker run --rm -it \
  -p 3000:3000 \
  -v "$(pwd)":/workspace/musicblocks \
  -w /workspace/musicblocks \
  mcr.microsoft.com/devcontainers/javascript-node:20 \
  bash
```

## 3. Install dependencies

Inside the container:

```bash
npm install
```

## 4. Start the development server

```bash
npm run dev
```

## 5. Open in browser

Visit:

```text
http://localhost:3000
```

---

# What's Included

| Feature | Details |
|---|---|
| Base Image | `mcr.microsoft.com/devcontainers/javascript-node:20` |
| Node.js Version | 20 LTS |
| Pre-installed Tools | `git`, `node`, `npm` |
| VS Code Extensions | ESLint, Prettier, JSON support |
| Forwarded Port | `3000` |
| Post-create Hook | `npm install` |

---

# Common Tasks

## Run tests

```bash
npm test
```

## Run linter

```bash
npm run lint
```

## Check formatting

```bash
npx prettier --check .
```

## Format all files

```bash
npx prettier --write .
```

---

# Troubleshooting

## Port 3000 is already in use

If you see:

```text
EADDRINUSE :::3000
```

another process is already using port `3000`.

### Solution

Stop the conflicting process or run on another port:

```bash
npm run dev -- --port 3001
```

---

## Changes to `devcontainer.json` are not applied

If you modify `.devcontainer/devcontainer.json`, rebuild the container.

### In VS Code

1. Open Command Palette
2. Run:

```text
Dev Containers: Rebuild Container
```

---

## Slow first startup

The first launch downloads the container image and installs dependencies.

Subsequent starts are significantly faster because the container is cached.

---

## Files appear owned by `root`

The development container normally runs as the `node` user.

If files become owned by `root`, fix permissions with:

```bash
sudo chown -R $(whoami) .
```

---

# Exiting the Environment

## VS Code Dev Containers

Closing VS Code automatically stops the container.

To reopen locally:

```text
Dev Containers: Reopen Folder Locally
```

## Docker

Exit the shell:

```bash
exit
```

The container stops automatically because it was started with `--rm`.

## Codespaces

Stop the Codespace from the GitHub interface when finished to avoid unnecessary usage.

---

# References

- [Dev Container Specification](https://containers.dev/implementors/json_reference/)
- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Music Blocks CONTRIBUTING Guide](../CONTRIBUTING.md)