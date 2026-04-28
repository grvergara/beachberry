# Presidio Psy

Mobile-first browser 3D exploration prototype for the Cursor Vibe Jam 2026, set in a bounded Presidio Tunnel Tops slice.

## Project Metadata

- **Branch**: `001-presidio-vibe-psy`
- **Build tool**: Vite
- **Runtime**: Browser ES modules (`index.html` + `bootstrap.js`)
- **Primary delivery shape**: static-hosted, single/minimal file output (`dist/`)

## Scripts

- `npm run dev` - start local Vite dev server
- `npm run build` - create production bundle in `dist/`
- `npm run preview` - serve built output locally

## Static Hosting Notes

The build output is static and can be deployed as-is from `dist/` to:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

For jam embed checks, ensure the widget target is present at `#jam-widget-mount` in `index.html` and verify no login wall is introduced.

## Final Architecture Decisions

- Rendering stack is browser-native ES modules with Vite bundling and a single canvas entrypoint.
- Core gameplay is split by domain modules (`game/*`, `world/*`, `render/*`, `ui/*`) while shipping as a minimal static artifact.
- Geospatial integration stays Flywave.gl-first, with any heavier alternative treated as fallback-only by spec contract.
- Performance polish uses dynamic quality scaling hooks in `render/scene.js` plus LOD fallback thresholds to protect mid-tier mobile FPS.
- Optional multiplayer echoes remain strictly additive and default-off, preserving a fully solo-critical path.

## Deployment Steps

1. Install dependencies: `npm install`
2. Run production build: `npm run build`
3. Run dependency and bundle audits:
   - `npm run audit:deps`
   - `npm run audit:bundle`
4. Smoke-check local static output: `npm run preview`
5. Deploy `dist/` to static hosting target (Vercel, Netlify, or Cloudflare Pages).
6. Re-verify jam embed behavior and widget presence in hosted build before submission.

## License

MIT - see [LICENSE](LICENSE).
