#!/bin/bash

# Pose Pilot - Deployment Script
echo "🚀 Deploying Pose Pilot..."

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found. Run this script from the project directory."
    exit 1
fi

# Create deployment directory
DEPLOY_DIR="pose-pilot-deploy"
echo "📁 Creating deployment directory: $DEPLOY_DIR"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy essential files
echo "📋 Copying files..."
cp index.html $DEPLOY_DIR/
cp styles.css $DEPLOY_DIR/
cp app.js $DEPLOY_DIR/
cp config.js $DEPLOY_DIR/
cp manifest.json $DEPLOY_DIR/
cp sw.js $DEPLOY_DIR/
cp test.html $DEPLOY_DIR/
cp README.md $DEPLOY_DIR/
cp SETUP.md $DEPLOY_DIR/

# Create .htaccess for Apache servers
echo "🔧 Creating .htaccess for Apache..."
cat > $DEPLOY_DIR/.htaccess << 'EOF'
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
</IfModule>

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Security headers
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy "strict-origin-when-cross-origin"
EOF

# Create deployment instructions
echo "📝 Creating deployment instructions..."
cat > $DEPLOY_DIR/DEPLOY.md << 'EOF'
# 🚀 Pose Pilot - Deployment Instructions

## Quick Deploy Options

### 1. Static Hosting (Recommended)
Upload the contents of this folder to:
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop this folder
- **GitHub Pages**: Push to gh-pages branch
- **Firebase Hosting**: `firebase deploy`

### 2. Traditional Web Hosting
- Upload all files via FTP/SFTP
- Ensure HTTPS is enabled
- Point domain to index.html

### 3. Local Testing
```bash
# Python HTTPS server
python3 -m http.server 8000

# Then visit: http://localhost:8000
```

## Required Configuration

1. **API Keys**: Users must add their OpenAI and Gemini API keys
2. **HTTPS**: Required for camera access on mobile devices
3. **CORS**: May need configuration for API calls

## Testing Checklist

- [ ] HTTPS enabled
- [ ] Camera permissions work
- [ ] PWA installation works
- [ ] Mobile responsive design
- [ ] API integrations functional

## Support

See SETUP.md for detailed configuration instructions.
EOF

# Create a simple validation script
echo "🧪 Creating validation script..."
cat > $DEPLOY_DIR/validate.js << 'EOF'
// Quick validation for deployment
console.log('🧪 Validating Pose Pilot deployment...');

// Check required files
const requiredFiles = [
    'index.html', 'styles.css', 'app.js', 
    'manifest.json', 'sw.js'
];

requiredFiles.forEach(file => {
    fetch(file)
        .then(response => {
            if (response.ok) {
                console.log(`✅ ${file} - OK`);
            } else {
                console.error(`❌ ${file} - Missing`);
            }
        })
        .catch(error => {
            console.error(`❌ ${file} - Error:`, error);
        });
});

// Check HTTPS
if (location.protocol === 'https:') {
    console.log('✅ HTTPS - Enabled');
} else {
    console.warn('⚠️ HTTPS - Disabled (required for camera)');
}

// Check camera API
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log('✅ Camera API - Supported');
} else {
    console.error('❌ Camera API - Not supported');
}

console.log('🎉 Validation complete!');
EOF

# Create package info
echo "📦 Creating package info..."
cat > $DEPLOY_DIR/package.json << 'EOF'
{
  "name": "pose-pilot",
  "version": "1.0.0",
  "description": "AI-powered pose recommendation and photo guidance mobile web app",
  "main": "index.html",
  "scripts": {
    "start": "python3 -m http.server 8000",
    "serve": "npx serve .",
    "validate": "node validate.js"
  },
  "keywords": ["ai", "photography", "mobile", "pwa", "chatgpt", "nano-banana"],
  "author": "Pose Pilot Team",
  "license": "MIT"
}
EOF

echo "✅ Deployment package created successfully!"
echo ""
echo "📁 Deployment files are in: $DEPLOY_DIR/"
echo ""
echo "🚀 Next steps:"
echo "   1. cd $DEPLOY_DIR"
echo "   2. Upload to your hosting provider"
echo "   3. Ensure HTTPS is enabled"
echo "   4. Test on mobile devices"
echo ""
echo "🎉 Ready to launch Pose Pilot!"