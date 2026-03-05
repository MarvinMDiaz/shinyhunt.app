# ShinyHunt.app

A modern, beautiful web application for tracking your shiny Pokémon hunting journey. Track encounters, calculate odds, visualize progress, and build your trophy case.

## Features

- 🎯 **Hunt Tracking**: Track multiple shiny hunts simultaneously
- 📊 **Progress Visualization**: Beautiful progress bars with customizable colors
- 📈 **Statistics**: Real-time probability calculations and statistics
- 📅 **Activity Heat Map**: Visualize your hunting activity over time
- 🏆 **Trophy Case**: Showcase your completed shiny hunts
- 🎨 **Dark Mode**: Beautiful dark theme support
- 💾 **Local Storage**: All data saved locally in your browser
- 📱 **Responsive**: Works perfectly on desktop and mobile

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **PokéAPI** for Pokémon data
- **localStorage** for data persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment

This app is configured for deployment on Railway. See `RAILWAY_DEPLOY.md` for detailed deployment instructions.

### Railway Deployment

1. Push your code to GitHub
2. Connect your GitHub repo to Railway
3. Railway will automatically detect and deploy
4. Add your custom domain in Railway settings

## Project Structure

```
src/
├── components/     # React components
├── lib/           # Utilities and API functions
├── types/         # TypeScript type definitions
└── hooks/         # Custom React hooks

public/            # Static assets (logo, etc.)
```

## License

MIT
