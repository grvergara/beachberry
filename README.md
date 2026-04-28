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

## License

MIT - see [LICENSE](LICENSE).
