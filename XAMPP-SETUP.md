# XAMPP/Localhost Setup Guide

## Quick Setup for XAMPP Hosting

### 1. Fix Package.json Scripts
Replace the "scripts" section in your `package.json` with:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development", 
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

### 2. Build for Static Hosting

Run one of these commands:

```bash
# Simple build
npm run build

# Or use the custom static builder
node build-static.js
```

### 3. Deploy to XAMPP

1. Copy all contents from the `dist` folder
2. Paste into your XAMPP `htdocs` directory (e.g., `htdocs/bspot-site/`)
3. Start XAMPP Apache server
4. Visit: `http://localhost/bspot-site/`

### 4. Alternative: Direct Development

For development without building:

```bash
npm install
npm run dev
```

Then visit: `http://localhost:8080`

### Troubleshooting

- **Missing script error**: Make sure package.json scripts are updated
- **White screen**: Check browser console for errors
- **Assets not loading**: Ensure paths are relative (base: './' in vite.config.ts)
- **Routing issues**: Use the included server.php for SPA routing in XAMPP

### File Structure After Build
```
dist/
├── index.html          # Main HTML file
├── server.php          # Optional PHP router for XAMPP
├── assets/             # CSS, JS, images
│   ├── index-[hash].css
│   ├── index-[hash].js
│   └── ...
└── [other assets]
```

### Notes
- The build creates static files that work on any web server
- No Node.js required on the hosting server
- All dependencies are bundled into the build
- Responsive design works on all devices