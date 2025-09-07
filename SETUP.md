# Pose Pilot Setup Guide

## 📱 Mobile Web App for AI-Powered Photo Guidance

This app provides real-time pose recommendations and generates improved photo examples using ChatGPT and Nano Banana APIs.

## 🚀 Quick Setup

### 1. API Keys Required

You'll need two API keys to run this app:

#### OpenAI API Key (for ChatGPT)
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

#### Google Gemini API Key (for Nano Banana)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key (starts with `AIza`)

### 2. Configuration

**Option A: Automatic Setup (Recommended)**
- The app will prompt you for API keys when you first open it
- Keys are stored securely in your browser's local storage

**Option B: Manual Configuration**
- Edit `config.js` and add your API keys
- Set `DEMO_MODE: false` to use real APIs

### 3. Running the App

#### Local Development
```bash
# Serve the files using a local server
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

#### Production Deployment
- Upload all files to your web server
- Ensure HTTPS is enabled (required for camera access)
- Configure proper CORS headers if needed

### 4. iPhone Safari Setup

For the best mobile experience:

1. **Add to Home Screen**
   - Open the app in Safari
   - Tap the Share button
   - Select "Add to Home Screen"

2. **Enable Camera Permissions**
   - Allow camera access when prompted
   - Check Safari settings if having issues

3. **Full Screen Mode**
   - The app will run in standalone mode when added to home screen

## 🎯 Features

### Core Functionality
- ✅ Mobile-responsive camera interface
- ✅ Photo capture with front/back camera support
- ✅ AI-powered pose analysis using ChatGPT
- ✅ 5 detailed suggestions per photo
- ✅ AI-generated example photos using Nano Banana
- ✅ Progressive Web App (PWA) support
- ✅ Offline-ready with service worker

### AI Suggestions Include
1. **Camera View & Position** - Optimal angles and perspectives
2. **Object Interaction** - How to engage with environment/props
3. **Lighting & Exposure** - Professional lighting techniques
4. **Background & Depth** - Composition and depth of field tips

## 🛠️ Technical Details

### Technologies Used
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **APIs**: OpenAI GPT-4 Vision, Google Gemini (Nano Banana)
- **PWA**: Service Worker, Web App Manifest
- **Camera**: MediaDevices API with mobile optimization

### Browser Compatibility
- ✅ Safari (iOS 12+)
- ✅ Chrome (Android/iOS)
- ✅ Firefox Mobile
- ✅ Edge Mobile

### Performance Optimizations
- Lazy loading of AI features
- Image compression before API calls
- Cached resources for offline use
- Optimized for mobile bandwidth

## 🔒 Privacy & Security

- API keys stored locally in browser
- Photos processed client-side
- No data sent to third-party servers (except APIs)
- HTTPS required for camera access

## 🐛 Troubleshooting

### Camera Issues
- Ensure HTTPS is enabled
- Check browser permissions
- Try refreshing the page
- Clear browser cache

### API Issues
- Verify API keys are correct
- Check API quotas/billing
- Enable demo mode for testing

### Performance Issues
- Close other browser tabs
- Ensure stable internet connection
- Try refreshing the app

## 📱 Demo Mode

If you want to test without API keys:
- Set `DEMO_MODE: true` in config.js
- Or click "Demo Mode" in the API key prompt
- Uses mock data for suggestions and placeholders for generated photos

## 🚀 Deployment Checklist

- [ ] API keys configured
- [ ] HTTPS enabled
- [ ] Service worker registered
- [ ] Camera permissions working
- [ ] Tested on target devices
- [ ] Performance optimized
- [ ] Error handling implemented

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify API key configuration
3. Test in demo mode first
4. Check network connectivity

---

**Ready to start taking better photos with AI guidance! 📸✨**