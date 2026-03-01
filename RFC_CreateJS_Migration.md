# RFC: Migrating from CreateJS to PixiJS + GSAP (#5971)

## Executive Summary
This RFC proposes replacing the abandoned **CreateJS** (EaselJS, TweenJS, PreloadJS) rendering stack with **PixiJS v8** and **GSAP 3**. The goal is to modernize the architectural foundation of Music Blocks, unlock WebGL/WebGPU performance, and ensure long‑term maintainability for the "DMP 2026" roadmap.

## 1. Rationale
- **Project abandonment**: CreateJS has not been updated since 2017.
- **Performance**: PixiJS provides GPU‑accelerated batching, essential for complex turtle graphics.
- **Modern standards**: PixiJS and GSAP are widely used, well‑documented, and support ES modules.

## 2. Technical Recommendation
- **Renderer**: PixiJS v8 (stage, containers, sprites).
- **Animation**: GSAP 3 (tweening, timelines).

## 3. Implementation Strategy – Compatibility Layer
1. **Phase 1** – Add `js/graphics-adapter.js` that maps a subset of the CreateJS API to PixiJS/GSAP. This allows the existing codebase to run unchanged while using the new engine.
2. **Phase 2** – Incrementally refactor core modules (`turtle.js`, `block.js`, `loader.js`) to use native PixiJS/GSAP APIs.
3. **Phase 3** – Remove CreateJS files from `lib/` and clean up shims.

## 4. Next Steps
- Review the prototype `graphics-adapter.js`.
- Create a `v3-migration` branch for community contributions.
- Draft a PR for Phase 1 implementation.
