# IFMS

Empty project scaffold sharing the ILGARS stack and theme.

## Stack

- [Vite 7](https://vite.dev) + [React 19](https://react.dev) + TypeScript (strict)
- [Tailwind CSS v4](https://tailwindcss.com) (CSS-based config in `src/index.css`)
- [shadcn/ui](https://ui.shadcn.com) component library (`src/components/ui`, config in `components.json`)
- OKLch design tokens with light/dark mode (`ThemeProvider`, press `d` to toggle)
- [TanStack Query](https://tanstack.com/query), [React Router 7](https://reactrouter.com), [sonner](https://sonner.emilkowal.ski) toasts, [lucide](https://lucide.dev) icons
- Outfit Variable font via `@fontsource-variable/outfit`

## Commands

```sh
npm install        # install dependencies
npm run dev        # start dev server
npm run build      # typecheck + production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run format     # prettier
```

## Environment

Copy `.env.example` to `.env` and fill in values as backend services are added.
