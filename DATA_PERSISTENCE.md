# Data Persistence Guide

## Overview

Your ShinyHunt.app data is automatically saved and protected using multiple layers of persistence. This ensures your hunt progress survives browser refreshes, computer restarts, and even some edge cases.

## How Data Persistence Works

### 1. **Automatic localStorage Saving**
- **Every change is saved automatically** - No manual save button needed
- Data persists across:
  - ✅ Browser refreshes
  - ✅ Computer restarts
  - ✅ Browser tabs/windows closing
  - ✅ App updates (when deployed)

### 2. **Enhanced Error Handling**
- Automatic quota management (clears old cache if storage is full)
- Fallback to backup if main data is corrupted
- Warnings if storage is unavailable

### 3. **Backup System**
- **Automatic backup copy** stored alongside main data
- **Manual backup** via Settings → Create Backup
- **Export/Import** functionality for cross-device transfers

## Accessing Backup Features

1. Click the **Settings icon** (⚙️) in the navigation bar
2. You'll see:
   - **Storage Usage** - Monitor how much space you're using
   - **Export Data** - Download a JSON backup file
   - **Import Data** - Restore from a backup file
   - **Create Backup Now** - Manually create a backup

## Best Practices

### ✅ Recommended
- **Export regularly** (weekly/monthly) for extra safety
- **Keep backup files** in cloud storage (Google Drive, Dropbox, etc.)
- **Monitor storage usage** - if it gets above 80%, consider exporting old hunts

### ⚠️ Important Notes
- Data is stored **locally in your browser**
- If you **clear browser data**, you'll lose your progress (unless you have a backup)
- Data is **device-specific** - use Export/Import to sync across devices
- **Private/Incognito mode** may not persist data after closing

## Storage Limits

- Most browsers allow **5-10MB** of localStorage
- Typical hunt data: ~1-5KB per hunt
- You can track **hundreds of hunts** before hitting limits
- Storage usage is displayed in Settings

## Troubleshooting

### "Storage not available" warning
- Your browser's localStorage is disabled
- Enable it in browser settings
- Try a different browser if issue persists

### "Save warning" notification
- Storage quota exceeded
- Export old hunts and delete them
- Clear browser cache (Pokémon images will re-download)

### Lost data after browser update
- Check if you have a backup file
- Import it via Settings → Import Data
- If no backup, data may be lost (always export regularly!)

## Railway Deployment

When deployed to Railway:
- ✅ Data persists across deployments
- ✅ Data persists across server restarts
- ✅ localStorage works exactly the same as local development
- ✅ No backend database needed (client-side storage)

## Export File Format

Backup files are JSON with this structure:
```json
{
  "hunts": [...],
  "currentHuntId": "...",
  "darkMode": true,
  "theme": "default",
  "version": "2.0.0",
  "exportedAt": "2026-03-05T..."
}
```

You can:
- **Share** backup files with others
- **Restore** on different devices
- **Archive** old hunts by exporting and deleting them

## Summary

Your data is **automatically protected** with:
1. ✅ Real-time auto-save
2. ✅ Backup copy system
3. ✅ Export/Import functionality
4. ✅ Error handling and recovery
5. ✅ Storage monitoring

**Just remember**: Export regularly for maximum safety! 🎯
