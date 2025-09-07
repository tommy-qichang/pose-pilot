// Pose Pilot - AI Photo Guidance App
class PosePilotApp {
    constructor() {
        this.currentStream = null;
        this.capturedImageData = null;
        this.suggestions = [];
        
        // Load API Configuration from config.js or use defaults
        this.config = {
            openaiApiKey: window.CONFIG?.OPENAI_API_KEY || '', 
            geminiApiKey: window.CONFIG?.GEMINI_API_KEY || '', 
            chatgptModel: window.CONFIG?.OPENAI_MODEL || 'gpt-4o',
            demoMode: window.CONFIG?.DEMO_MODE || false
        };
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.setupMobileOptimizations();
        this.checkApiKeys();
    }

    setupMobileOptimizations() {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Handle viewport changes (especially for iOS Safari)
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 100);
        });

        // Prevent pull-to-refresh on mobile
        document.body.addEventListener('touchstart', e => {
            if (e.touches.length !== 1) { return; }
            const y = e.touches[0].clientY;
            if (y <= 10) {
                e.preventDefault();
            }
        }, { passive: false });

        document.body.addEventListener('touchmove', e => {
            if (e.touches.length !== 1) { return; }
            const y = e.touches[0].clientY;
            if (y <= 10) {
                e.preventDefault();
            }
        }, { passive: false });

        // Wake lock to prevent screen from sleeping during photo capture
        this.setupWakeLock();
    }

    async setupWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = null;
                
                // Request wake lock when camera starts
                document.getElementById('start-camera-btn').addEventListener('click', async () => {
                    try {
                        this.wakeLock = await navigator.wakeLock.request('screen');
                        console.log('Screen wake lock activated');
                    } catch (err) {
                        console.log('Wake lock failed:', err);
                    }
                });

                // Release wake lock when photo is captured or app loses focus
                document.addEventListener('visibilitychange', () => {
                    if (this.wakeLock !== null && document.visibilityState === 'hidden') {
                        this.wakeLock.release();
                        this.wakeLock = null;
                        console.log('Screen wake lock released');
                    }
                });
                
            } catch (err) {
                console.log('Wake lock not supported:', err);
            }
        }
    }

    checkApiKeys() {
        // Load saved keys from localStorage if not in config
        if (!this.config.openaiApiKey) {
            this.config.openaiApiKey = localStorage.getItem('posepilot_openai_key') || '';
        }
        if (!this.config.geminiApiKey) {
            this.config.geminiApiKey = localStorage.getItem('posepilot_gemini_key') || '';
        }
        
        // Check if API keys are configured
        if (!this.config.openaiApiKey || !this.config.geminiApiKey) {
            this.showApiKeyPrompt();
        } else {
            console.log('✅ API keys loaded successfully');
        }
    }

    showApiKeyPrompt() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 16px; max-width: 400px; width: 100%;">
                <h2 style="margin-bottom: 20px; color: #333;">🔑 API Keys Required</h2>
                <p style="margin-bottom: 20px; color: #666;">To use Pose Pilot, you need to add your API keys:</p>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">OpenAI API Key:</label>
                    <input type="password" id="openai-key" placeholder="sk-..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Gemini API Key:</label>
                    <input type="password" id="gemini-key" placeholder="AIza..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button id="save-keys" style="flex: 1; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600;">Save Keys</button>
                    <button id="demo-mode" style="flex: 1; padding: 12px; background: #ccc; color: #666; border: none; border-radius: 8px; font-weight: 600;">Demo Mode</button>
                </div>
                
                <p style="margin-top: 15px; font-size: 12px; color: #999;">Keys are stored locally and never sent to our servers.</p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('save-keys').onclick = () => {
            const openaiKey = document.getElementById('openai-key').value;
            const geminiKey = document.getElementById('gemini-key').value;
            
            if (openaiKey && geminiKey) {
                this.config.openaiApiKey = openaiKey;
                this.config.geminiApiKey = geminiKey;
                localStorage.setItem('posepilot_openai_key', openaiKey);
                localStorage.setItem('posepilot_gemini_key', geminiKey);
                document.body.removeChild(modal);
            } else {
                alert('Please enter both API keys');
            }
        };
        
        document.getElementById('demo-mode').onclick = () => {
            this.config.demoMode = true;
            document.body.removeChild(modal);
        };
        
        // Load saved keys
        const savedOpenAI = localStorage.getItem('posepilot_openai_key');
        const savedGemini = localStorage.getItem('posepilot_gemini_key');
        if (savedOpenAI) document.getElementById('openai-key').value = savedOpenAI;
        if (savedGemini) document.getElementById('gemini-key').value = savedGemini;
    }

    setupEventListeners() {
        // Camera controls
        document.getElementById('start-camera-btn').addEventListener('click', () => this.startCamera());
        document.getElementById('capture-btn').addEventListener('click', () => this.capturePhoto());
        document.getElementById('retake-btn').addEventListener('click', () => this.retakePhoto());
        
        // AI analysis
        document.getElementById('analyze-btn').addEventListener('click', () => this.analyzePhoto());
    }

    async startCamera() {
        try {
            // Try back camera first, fallback to front camera
            let constraints = {
                video: {
                    facingMode: { exact: 'environment' },
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 }
                }
            };

            try {
                this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (backCameraError) {
                console.log('Back camera not available, trying front camera');
                constraints.video.facingMode = 'user';
                this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            }

            const videoElement = document.getElementById('camera-preview');
            videoElement.srcObject = this.currentStream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                videoElement.onloadedmetadata = resolve;
            });
            
            // Update UI
            document.getElementById('start-camera-btn').style.display = 'none';
            document.getElementById('capture-btn').style.display = 'inline-flex';
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showCameraError(error);
        }
    }

    showCameraError(error) {
        let message = 'Unable to access camera. ';
        
        if (error.name === 'NotAllowedError') {
            message += 'Please allow camera permissions and try again.';
        } else if (error.name === 'NotFoundError') {
            message += 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
            message += 'Camera not supported by this browser.';
        } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            message += 'Camera requires HTTPS connection.';
        } else {
            message += 'Please check your camera settings and try again.';
        }
        
        alert(message);
    }

    capturePhoto() {
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('photo-canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        this.capturedImageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Display captured image
        const capturedPhoto = document.getElementById('captured-photo');
        const capturedImage = document.getElementById('captured-image');
        capturedImage.src = this.capturedImageData;
        capturedPhoto.style.display = 'block';
        
        // Hide video and update controls
        video.style.display = 'none';
        document.getElementById('capture-btn').style.display = 'none';
        document.getElementById('retake-btn').style.display = 'inline-flex';
        
        // Show AI section
        document.getElementById('ai-section').style.display = 'block';
        document.getElementById('ai-section').classList.add('fade-in');
        
        // Stop camera stream
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
        }
    }

    retakePhoto() {
        // Reset UI
        document.getElementById('camera-preview').style.display = 'block';
        document.getElementById('captured-photo').style.display = 'none';
        document.getElementById('retake-btn').style.display = 'none';
        document.getElementById('ai-section').style.display = 'none';
        document.getElementById('suggestions-section').style.display = 'none';
        document.getElementById('generated-photos-section').style.display = 'none';
        
        // Restart camera
        this.startCamera();
    }

    async analyzePhoto() {
        if (!this.capturedImageData) {
            alert('Please capture a photo first');
            return;
        }

        // Show loading
        document.getElementById('loading-spinner').style.display = 'block';
        document.getElementById('analyze-btn').disabled = true;

        try {
            if (this.config.demoMode) {
                // Demo mode with mock data
                await this.showDemoSuggestions();
            } else {
                // Real API calls
                await this.getChatGPTSuggestions();
            }
        } catch (error) {
            console.error('Error analyzing photo:', error);
            alert('Error analyzing photo. Please try again.');
        } finally {
            document.getElementById('loading-spinner').style.display = 'none';
            document.getElementById('analyze-btn').disabled = false;
        }
    }

    async getChatGPTSuggestions() {
        const prompt = `You are a professional photography coach. Analyze this photo and provide exactly 2 specific, actionable suggestions to improve the composition, pose, and overall quality. 

For each suggestion, provide:
1. A clear title (max 6 words)
2. Camera View & Position advice
3. Object Interaction suggestions
4. Lighting & Exposure tips
5. Background & Depth recommendations

Format your response as a JSON array with this structure:
[
  {
    "title": "Suggestion Title",
    "cameraView": "Camera positioning advice",
    "interaction": "How to interact with objects/environment",
    "lighting": "Lighting and exposure guidance",
    "background": "Background and depth recommendations"
  }
]

Be specific, practical, and focus on improvements that would make a noticeable difference in the photo quality.`;

        try {
            console.log('🤖 Calling ChatGPT API with key:', this.config.openaiApiKey ? 'Present' : 'Missing');
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: this.config.chatgptModel,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: prompt
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: this.capturedImageData
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1500
                })
            });

            const data = await response.json();
            console.log('📥 ChatGPT API response:', response.status, data);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                console.log('📝 Raw ChatGPT content:', content);
                
                try {
                    // Extract JSON from markdown code blocks if present
                    let jsonString = content.trim();
                    
                    // Remove markdown code blocks
                    if (jsonString.startsWith('```json')) {
                        // Remove opening ```json
                        jsonString = jsonString.replace(/^```json\s*/, '');
                        // Remove closing ```
                        jsonString = jsonString.replace(/\s*```$/, '');
                    } else if (jsonString.startsWith('```')) {
                        // Remove opening ```
                        jsonString = jsonString.replace(/^```\s*/, '');
                        // Remove closing ```
                        jsonString = jsonString.replace(/\s*```$/, '');
                    }
                    
                    jsonString = jsonString.trim();
                    console.log('📋 Extracted JSON:', jsonString);
                    
                    this.suggestions = JSON.parse(jsonString);
                    console.log('✅ Parsed suggestions:', this.suggestions);
                    await this.displaySuggestions();
                    await this.generateExamplePhotos();
                } catch (parseError) {
                    console.error('❌ Error parsing suggestions:', parseError);
                    console.log('📄 Failed content:', content);
                    // Fallback to demo mode
                    await this.showDemoSuggestions();
                }
            } else {
                throw new Error('Invalid response from ChatGPT');
            }
        } catch (error) {
            console.error('ChatGPT API error:', error);
            // Fallback to demo mode
            await this.showDemoSuggestions();
        }
    }

    async showDemoSuggestions() {
        // Demo suggestions for when API keys are not available
        this.suggestions = [
            {
                title: "Improve Camera Angle",
                cameraView: "Lower your camera to eye level or slightly below for a more engaging perspective",
                interaction: "Step closer to your subject and fill more of the frame",
                lighting: "Move to face a window or light source for better illumination",
                background: "Find a less cluttered background or use depth of field to blur it"
            },
            {
                title: "Better Lighting Setup",
                cameraView: "Shoot during golden hour (1 hour before sunset) for warm, soft light",
                interaction: "Use a reflector or white surface to bounce light onto your subject",
                lighting: "Avoid harsh overhead lighting that creates unflattering shadows",
                background: "Position subject with light source at a 45-degree angle"
            }
        ];

        await this.displaySuggestions();
        await this.generateExamplePhotos();
    }

    async displaySuggestions() {
        const container = document.getElementById('suggestions-container');
        container.innerHTML = '';

        this.suggestions.forEach((suggestion, index) => {
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.innerHTML = `
                <div class="suggestion-title">${index + 1}. ${suggestion.title}</div>
                <div class="suggestion-details">
                    <div class="suggestion-detail">
                        <strong>📷 Camera:</strong>
                        <span>${suggestion.cameraView}</span>
                    </div>
                    <div class="suggestion-detail">
                        <strong>🤝 Interaction:</strong>
                        <span>${suggestion.interaction}</span>
                    </div>
                    <div class="suggestion-detail">
                        <strong>💡 Lighting:</strong>
                        <span>${suggestion.lighting}</span>
                    </div>
                    <div class="suggestion-detail">
                        <strong>🎨 Background:</strong>
                        <span>${suggestion.background}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Show suggestions section
        document.getElementById('suggestions-section').style.display = 'block';
        document.getElementById('suggestions-section').classList.add('slide-up');
    }

    async generateExamplePhotos() {
        // Show generated photos section
        document.getElementById('generated-photos-section').style.display = 'block';
        document.getElementById('generation-loading').style.display = 'block';

        if (this.config.demoMode || !this.config.geminiApiKey) {
            // Show demo placeholders
            setTimeout(() => {
                this.showDemoGeneratedPhotos();
            }, 2000);
            return;
        }

        try {
            await this.generateWithNanoBanana();
        } catch (error) {
            console.error('Error generating photos:', error);
            this.showDemoGeneratedPhotos();
        }
    }

    async generateWithNanoBanana() {
        const container = document.getElementById('generated-photos-container');
        
        // Create prompts based on top 2 suggestions
        const prompts = [
            this.createNanoBananaPrompt(this.suggestions[0]),
            this.createNanoBananaPrompt(this.suggestions[1])
        ];

        for (let i = 0; i < 2; i++) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${this.config.geminiApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {
                                    text: prompts[i]
                                },
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: this.capturedImageData.split(',')[1]
                                    }
                                }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0.8,
                            topK: 40,
                            topP: 0.95,
                        }
                    })
                });

                const data = await response.json();
                console.log(`🍌 Nano Banana response ${i + 1}:`, data);
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    // Extract image data from Gemini response
                    const content = data.candidates[0].content;
                    let imageData = null;
                    
                    // Look for image data in the parts array
                    if (content.parts) {
                        for (const part of content.parts) {
                            if (part.inlineData && part.inlineData.data) {
                                imageData = part.inlineData.data;
                                break;
                            }
                        }
                    }
                    
                    if (imageData) {
                        // Convert base64 to data URL
                        const mimeType = content.parts.find(p => p.inlineData)?.inlineData?.mimeType || 'image/png';
                        const dataUrl = `data:${mimeType};base64,${imageData}`;
                        this.displayGeneratedPhoto(i, dataUrl);
                    } else {
                        console.error('No image data found in response');
                        this.displayGeneratedPhotoPlaceholder(i);
                    }
                } else {
                    throw new Error('Invalid response from Nano Banana');
                }
            } catch (error) {
                console.error(`Error generating photo ${i + 1}:`, error);
                this.displayGeneratedPhotoPlaceholder(i);
            }
        }

        document.getElementById('generation-loading').style.display = 'none';
    }

    createNanoBananaPrompt(suggestion) {
        return `Create an improved version of this photo following these specific guidelines:
        
Camera & Composition: ${suggestion.cameraView}
Subject Interaction: ${suggestion.interaction}  
Lighting: ${suggestion.lighting}
Background: ${suggestion.background}

Generate a professional, high-quality photograph that demonstrates these improvements while maintaining the essence of the original image. Focus on realistic lighting, proper composition, and enhanced visual appeal.`;
    }

    displayGeneratedPhoto(index, content) {
        const container = document.getElementById('generated-photos-container');
        const photoDiv = container.children[index] || document.createElement('div');
        
        if (!photoDiv.parentNode) {
            photoDiv.className = 'generated-photo';
            container.appendChild(photoDiv);
        }
        
        // This would need to be adapted based on the actual Nano Banana API response format
        photoDiv.innerHTML = `<img src="${content}" alt="AI Generated Example ${index + 1}">`;
    }

    displayGeneratedPhotoPlaceholder(index) {
        const container = document.getElementById('generated-photos-container');
        const photoDiv = container.children[index] || document.createElement('div');
        
        if (!photoDiv.parentNode) {
            photoDiv.className = 'generated-photo';
            container.appendChild(photoDiv);
        }
        
        photoDiv.innerHTML = `
            <div class="generated-photo-placeholder">
                📸<br>
                Example ${index + 1}<br>
                <small>Generated photo would appear here</small>
            </div>
        `;
    }

    showDemoGeneratedPhotos() {
        const container = document.getElementById('generated-photos-container');
        container.innerHTML = '';
        
        for (let i = 0; i < 2; i++) {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'generated-photo';
            photoDiv.innerHTML = `
                <div class="generated-photo-placeholder">
                    ✨<br>
                    AI Example ${i + 1}<br>
                    <small>Enhanced photo based on suggestion ${i + 1}</small>
                </div>
            `;
            container.appendChild(photoDiv);
        }
        
        document.getElementById('generation-loading').style.display = 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PosePilotApp();
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
