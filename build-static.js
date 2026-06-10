#!/usr/bin/env node

/**
 * Simple build script for XAMPP/localhost hosting
 * Creates a static build that can be served from any web server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building static version for XAMPP/localhost...');

try {
  // Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  // Create a simple index.html in dist that works with any server
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Make paths relative for XAMPP hosting
    indexContent = indexContent.replace(/href="\//g, 'href="./');
    indexContent = indexContent.replace(/src="\//g, 'src="./');
    
    fs.writeFileSync(indexPath, indexContent);
    console.log('✅ Index.html updated for static hosting');
  }

  // Create a simple server.php for XAMPP (optional)
  const serverPhp = `<?php
// Simple PHP router for XAMPP
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);

// Serve static files directly
if (file_exists(__DIR__ . $path) && $path !== '/') {
    return false;
}

// Serve index.html for SPA routing
header('Content-Type: text/html');
readfile(__DIR__ . '/index.html');
?>`;

  fs.writeFileSync(path.join(distPath, 'server.php'), serverPhp);

  console.log('✅ Static build complete!');
  console.log('📁 Files are in the "dist" folder');
  console.log('🌐 Copy the "dist" folder contents to your XAMPP htdocs directory');
  console.log('🔧 Access via: http://localhost/your-folder-name/');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}