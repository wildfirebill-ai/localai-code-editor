---
name: docker-build-run
description: Build the project's Docker image, run it safely, verify it works, and clean up
category: docker
---
Containerize and verify a service:

1. **Build**: `docker build -t <project>:dev .` — read build errors carefully; fix the Dockerfile at the failing step (usually missing files in COPY, wrong lockfile, or platform-specific deps).
2. **Run safely**:
   - Map a free port: `-p 4801:4801` (or the app's port).
   - Never mount `/var/run/docker.sock` unless explicitly requested.
   - Prefer `-v $(pwd):/workspace`-style mounts over baking user paths into images.
   - Name the container (`--name <project>-dev`) so it's easy to remove.
3. **Verify**: hit the health endpoint or root URL (curl / Invoke-WebRequest) until it responds; check `docker logs` for startup errors. A container that starts is NOT a working container — prove the app answers.
4. **Iterate**: on failure, fix, rebuild, re-run. Use `--no-cache` only when layer caching is suspected.
5. **Clean up**: `docker rm -f <project>-dev` when done testing. Leave no orphan containers/volumes.

Dockerfile hygiene when authoring: multi-stage builds, pin base tags, copy lockfile before source for cache hits, non-root USER, HEALTHCHECK.
