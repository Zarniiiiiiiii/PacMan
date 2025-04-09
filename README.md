# Pac-Man Web Game

A web-based Pac-Man game built with JavaScript and HTML5 Canvas.

## How to Revert Deployment Changes

If you need to revert the Vercel deployment changes, follow these steps:

```bash
# Reset to pre-Vercel state
git checkout backup-pre-vercel-changes
git branch -f main backup-pre-vercel-changes
git push origin main --force
```

This will restore the repository to its state before the Vercel deployment changes were made.

## Development

To run the game locally:
```bash
npm install
npm start
```

The game will be available at http://localhost:1234 