# Setup Instructions

## Prerequisites

- Node.js 18+ and npm installed

## Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173` (or the port shown in the terminal)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/            # shadcn/ui base components
│   ├── HuntSwitcher.tsx
│   ├── CreateHuntDialog.tsx
│   ├── RenameHuntDialog.tsx
│   ├── DeleteHuntDialog.tsx
│   ├── HuntDetails.tsx
│   ├── ProgressPanel.tsx
│   ├── HistoryLog.tsx
│   ├── PokemonSearch.tsx
│   ├── DarkModeToggle.tsx
│   └── ExportImport.tsx
├── lib/               # Utilities
│   ├── utils.ts      # Helper functions
│   ├── storage.ts    # localStorage management
│   └── pokeapi.ts    # PokéAPI integration
├── types/            # TypeScript types
│   └── index.ts
├── hooks/            # Custom React hooks
│   └── use-toast.ts
├── App.tsx           # Main app component
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Features

✅ Multiple hunt profiles with full CRUD operations
✅ PokéAPI integration with caching
✅ Statistics calculations (probability, confidence intervals)
✅ History log with undo functionality
✅ Dark mode toggle
✅ Export/import JSON functionality
✅ Responsive design
✅ Hold-to-increment buttons
✅ Goal tracking with progress bar

## Notes

- All data is stored in localStorage (no backend required)
- Pokémon data is cached for 7 days
- The app defaults to dark mode
- Export files include all hunts and settings
