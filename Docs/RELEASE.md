# Release Process (Docker Image)

This repository publishes a Docker image to GitHub Container Registry (GHCR) when a new release tag is pushed. The image is tagged with the release version and also with the major and minor versions for easier reference.

## Publish a release

1. Ensure your local `master` is up to date.
2. Choose the next version following [Semantic Versioning](https://semver.org/) (e.g. `v3.4.2`).
3. Create and push the tag:

```bash
git tag -a v3.4.2 -m "Release v3.4.2"
git push origin v3.4.2
```

This triggers the **Publish Docker Image** workflow, which will:

- Build the Docker image
- Run a **smoke test** (starts the container and verifies it responds on port 3000)
- Run a **Trivy vulnerability scan** (reports CRITICAL/HIGH CVEs in the build log)
- Push to GHCR if all checks pass

The following image tags are produced for a stable release:

```text
ghcr.io/sugarlabs/musicblocks:3.4.2
ghcr.io/sugarlabs/musicblocks:3.4
ghcr.io/sugarlabs/musicblocks:3
ghcr.io/sugarlabs/musicblocks:latest
```

### Pre-release versions

For pre-release tags (e.g. `v3.5.0-rc.1`), the `latest` tag is **not** updated.
Only the exact version tag is pushed:

```text
ghcr.io/sugarlabs/musicblocks:3.5.0-rc.1
```

### Manual builds

The workflow can also be triggered manually via **Actions → Publish Docker Image → Run workflow**. Use the `push_image` input to control whether the image is pushed to GHCR.

## Rollback

1. Identify a previous stable release tag (e.g. `v3.4.1`).
2. Deploy that image tag in your environment:
    ```bash
    docker pull ghcr.io/sugarlabs/musicblocks:3.4.1
    ```
3. If you need `latest` to point to the previous release, push a new patch tag
   (e.g. `v3.4.3`) pointing at the same commit as the rollback target.

## Local smoke test (optional)

```bash
docker build -f dockerfile -t musicblocks .
docker run -d --name mb-test -p 3000:3000 musicblocks
curl --fail http://localhost:3000
docker stop mb-test && docker rm mb-test
```
