class PosePilotApp {
    constructor() {
        // Load API Configuration from config.js or use defaults
        this.config = {
            openaiApiKey: window.CONFIG?.OPENAI_API_KEY || '', 
            geminiApiKey: window.CONFIG?.GEMINI_API_KEY || '', 
            chatgptModel: window.CONFIG?.OPENAI_MODEL || 'gpt-4o',
            demoMode: window.CONFIG?.DEMO_MODE || false
        };

        // App state
        this.stream = null;
        this.currentCamera = 'user'; // 'user' for front, 'environment' for back
        this.capturedImageData = null;
        this.suggestions = [];
        this.generatedImages = [];
        this.currentImageIndex = 0; // 0 = original, 1+ = AI generated
        this.isProcessing = false;

        // Initialize app
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Pose Pilot...');
        
        // Check API keys
        this.checkApiKeys();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start camera
        await this.startCamera();
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
        const modal = document.getElementById('api-key-modal');
        modal.style.display = 'flex';
    }

    setupEventListeners() {
        // Camera switch
        document.getElementById('camera-switch').addEventListener('click', () => {
            this.switchCamera();
        });

        // Capture button
        document.getElementById('capture-btn').addEventListener('click', () => {
            if (this.capturedImageData) {
                this.retakePhoto();
            } else {
                this.capturePhoto();
            }
        });

        // Upload button
        document.getElementById('upload-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        // File input
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // PosePilot button
        document.getElementById('pose-pilot-btn').addEventListener('click', () => {
            if (!this.isProcessing && this.capturedImageData) {
                if (this.generatedImages.length === 0) {
                    this.startAIProcessing();
                } else {
                    this.cycleToNextImage();
                }
            }
        });

        // Back to original button
        document.getElementById('back-to-original').addEventListener('click', () => {
            this.showOriginalPhoto();
        });

        // API Key modal
        document.getElementById('save-keys-btn').addEventListener('click', () => {
            this.saveApiKeys();
        });

        document.getElementById('demo-mode-btn').addEventListener('click', () => {
            this.enableDemoMode();
        });

        // Prevent default touch behaviors
        document.addEventListener('touchmove', (e) => {
            if (e.target.tagName !== 'INPUT') {
                e.preventDefault();
            }
}, { passive: false });
    }

    async startCamera() {
        try {
            console.log('📹 Starting camera...');
            
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('camera-preview');
            video.srcObject = this.stream;
            
            console.log('✅ Camera started successfully');
        } catch (error) {
            console.error('❌ Camera error:', error);
            this.showError('Camera access denied. Please allow camera permissions.');
        }
    }

    async switchCamera() {
        this.currentCamera = this.currentCamera === 'user' ? 'environment' : 'user';
        await this.startCamera();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            this.showError('Please select an image file');
            return;
        }
        
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('Image file too large. Please select a file under 10MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.processUploadedImage(e.target.result);
        };
        reader.readAsDataURL(file);
        
        // Clear the input so the same file can be selected again
        event.target.value = '';
        
        console.log('📁 File uploaded:', file.name);
    }

    processUploadedImage(dataUrl) {
        const video = document.getElementById('camera-preview');
        const capturedImage = document.getElementById('captured-image');
        const aiGeneratedImage = document.getElementById('ai-generated-image');
        
        // Reset state
        this.suggestions = [];
        this.generatedImages = [];
        this.poseIQ = null;
        this.currentImageIndex = 0;
        this.isProcessing = false;
        
        // Set the uploaded image as captured image
        this.capturedImageData = dataUrl;
        capturedImage.src = dataUrl;
        
        // Show uploaded image
        video.style.display = 'none';
        capturedImage.style.display = 'block';
        aiGeneratedImage.style.display = 'none';
        
        // Update UI
        this.updateCaptureButton();
        this.updatePosePilotButton();
        this.hideBackButton();
        this.hidePoseIQ();
        
        console.log('📸 Image uploaded and processed');
        
        // Automatically start AI processing
        setTimeout(() => {
            this.startAIProcessing();
        }, 500);
    }

    capturePhoto() {
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('photo-canvas');
        const capturedImage = document.getElementById('captured-image');
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Convert to data URL
        this.capturedImageData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Show captured image
        capturedImage.src = this.capturedImageData;
        capturedImage.style.display = 'block';
        video.style.display = 'none';
        
        // Update UI
        this.updateCaptureButton();
        this.updatePosePilotButton();
        
        console.log('📸 Photo captured');
        
        // Automatically start AI processing
        setTimeout(() => {
            this.startAIProcessing();
        }, 500); // Small delay to show the captured photo first
    }

    retakePhoto() {
        const video = document.getElementById('camera-preview');
        const capturedImage = document.getElementById('captured-image');
        const aiGeneratedImage = document.getElementById('ai-generated-image');
        
        // Reset state
        this.capturedImageData = null;
        this.suggestions = [];
        this.generatedImages = [];
        this.poseIQ = null;
        this.currentImageIndex = 0;
        this.isProcessing = false;
        
        // Show camera feed
        video.style.display = 'block';
        capturedImage.style.display = 'none';
        aiGeneratedImage.style.display = 'none';
        
        // Update UI
        this.updateCaptureButton();
        this.updatePosePilotButton();
        this.hideBackButton();
        this.hidePoseIQ();
        
        console.log('🔄 Photo retaken');
    }

    async startAIProcessing() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.showPosePilotLoading();
        
        try {
            // Get AI suggestions
            await this.getChatGPTSuggestions();
            
            // Generate AI images
            await this.generateAIImages();
            
            // Show first AI image
            this.showAIImage(0);
            
        } catch (error) {
            console.error('❌ AI processing error:', error);
            this.showError('AI processing failed. Please try again.');
        } finally {
            this.isProcessing = false;
            this.hidePosePilotLoading();
            this.updatePosePilotButton();
        }
    }

    async getChatGPTSuggestions() {
        const prompt = `You are a professional photography coach. Analyze this photo and provide:

1. A PoseIQ score (0-100) with a brief comment about what's working well
2. Exactly 3 specific suggestions, one for each category:

**Angle**: Adjust the camera or face angle, or body position—such as shooting from a low angle for a powerful stance, tilting the face three-quarters toward the light, or zooming in for intimate detail—to enhance composition, depth, and perspective.

**Interaction**: Encourage the subject to engage with their environment or others—like pointing at a landmark, holding a prop, reaching toward the light, or making eye contact with a companion—to add storytelling and emotion to the frame.

**Go Bold**: Prompt the subject to step outside their comfort zone with expressive movements, dynamic gestures, or unconventional poses—like mid-jump, dramatic fabric swirls, or asymmetric balance—for a striking, unforgettable shot.

Format your response as JSON:
{
  "poseIQ": {
    "score": 87,
    "comment": "Great symmetry!"
  },
  "suggestions": [
    {
      "type": "angle",
      "title": "Lower Camera Angle",
      "description": "Specific angle advice...",
      "scoreIncrease": 8
    },
    {
      "type": "interaction",
      "title": "Point at Landmark",
      "description": "Specific interaction advice...",
      "scoreIncrease": 12
    },
    {
      "type": "go-bold",
      "title": "Jump Mid-Air",
      "description": "Specific bold pose advice...",
      "scoreIncrease": 15
    }
  ]
}

Be specific, practical, and focus on improvements that would create a more compelling photograph. Include realistic score increases (5-20 points) based on impact potential.`;

        try {
            console.log('🤖 Calling ChatGPT API...');
            
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
            console.log('📥 ChatGPT response:', data);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                
                // Extract JSON from markdown code blocks if present
                let jsonString = content.trim();
                
                if (jsonString.startsWith('```json')) {
                    jsonString = jsonString.replace(/^```json\s*/, '');
                    jsonString = jsonString.replace(/\s*```$/, '');
                } else if (jsonString.startsWith('```')) {
                    jsonString = jsonString.replace(/^```\s*/, '');
                    jsonString = jsonString.replace(/\s*```$/, '');
                }
                
                jsonString = jsonString.trim();
                
                const result = JSON.parse(jsonString);
                console.log('✅ Parsed result:', result);
                
                // Extract PoseIQ and suggestions
                this.poseIQ = result.poseIQ || { score: 75, comment: "Good photo!" };
                this.suggestions = result.suggestions || [];
                
                // Show PoseIQ overlay
                this.showPoseIQ();
            } else {
                throw new Error('Invalid response from ChatGPT');
            }
        } catch (error) {
            console.error('❌ ChatGPT error:', error);
            // Use demo suggestions as fallback
            this.poseIQ = { score: 78, comment: "Good potential!" };
            this.suggestions = [
                {
                    type: "angle",
                    title: "Three-Quarter Angle",
                    description: "Lower the camera slightly and shoot from a three-quarter angle to create more depth and a flattering perspective.",
                    scoreIncrease: 10
                },
                {
                    type: "interaction",
                    title: "Point at Background",
                    description: "Try pointing at something interesting in the background or holding a meaningful object to add storytelling to your photo.",
                    scoreIncrease: 12
                },
                {
                    type: "go-bold",
                    title: "Add Movement",
                    description: "Try a mid-step pose or gentle hair flip to bring energy and life to the shot.",
                    scoreIncrease: 15
                }
            ];
            this.showPoseIQ();
        }
    }

    async generateAIImages() {
        console.log('🍌 Generating AI images...');
        
        this.generatedImages = [];
        
        for (let i = 0; i < 3; i++) {
            try {
                const prompt = this.createNanoBananaPrompt(this.suggestions[i]);
                
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${this.config.geminiApiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {
                                    text: prompt
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
                    const content = data.candidates[0].content;
                    let imageData = null;
                    
                    if (content.parts) {
                        for (const part of content.parts) {
                            if (part.inlineData && part.inlineData.data) {
                                imageData = part.inlineData.data;
                                break;
                            }
                        }
                    }
                    
                    if (imageData) {
                        const mimeType = content.parts.find(p => p.inlineData)?.inlineData?.mimeType || 'image/png';
                        const dataUrl = `data:${mimeType};base64,${imageData}`;
                        this.generatedImages.push({
                            url: dataUrl,
                            suggestion: this.suggestions[i]
                        });
                    }
                }
            } catch (error) {
                console.error(`❌ Error generating image ${i + 1}:`, error);
            }
        }
        
        console.log(`✅ Generated ${this.generatedImages.length} AI images`);
    }

    createNanoBananaPrompt(suggestion) {
        const typeInstructions = {
            interaction: "Focus on adding storytelling elements, environmental engagement, and emotional connection",
            angle: "Emphasize improved camera positioning, perspective, and compositional depth", 
            "go-bold": "Create dynamic movement, expressive gestures, and striking unconventional poses"
        };
        
        return `Create an improved version of this photo following this ${suggestion.type} guidance:

${suggestion.description}

${typeInstructions[suggestion.type] || "Focus on general improvements"}

Generate a professional, high-quality photograph that demonstrates these improvements while maintaining the essence of the original image. Focus on realistic lighting, proper composition, and enhanced visual appeal.`;
    }

    showAIImage(index) {
        if (index < 0 || index >= this.generatedImages.length) return;
        
        const aiImage = document.getElementById('ai-generated-image');
        const capturedImage = document.getElementById('captured-image');
        
        aiImage.src = this.generatedImages[index].url;
        aiImage.style.display = 'block';
        capturedImage.style.display = 'none';
        
        this.currentImageIndex = index + 1; // +1 because 0 is original
        this.showBackButton();
        this.updatePosePilotButton();
        this.updatePoseIQSuggestion();
    }

    showOriginalPhoto() {
        const aiImage = document.getElementById('ai-generated-image');
        const capturedImage = document.getElementById('captured-image');
        
        aiImage.style.display = 'none';
        capturedImage.style.display = 'block';
        
        this.currentImageIndex = 0;
        this.hideBackButton();
        this.updatePosePilotButton();
        this.updatePoseIQSuggestion();
    }

    cycleToNextImage() {
        if (this.generatedImages.length === 0) return;
        
        if (this.currentImageIndex === 0) {
            // Show first AI image
            this.showAIImage(0);
        } else if (this.currentImageIndex < this.generatedImages.length) {
            // Show next AI image
            this.showAIImage(this.currentImageIndex);
        } else {
            // Back to original
            this.showOriginalPhoto();
        }
    }

    updateCaptureButton() {
        const captureBtn = document.getElementById('capture-btn');
        const captureLabel = document.getElementById('capture-label');
        
        if (this.capturedImageData) {
            captureBtn.innerHTML = '🔄';
            captureLabel.textContent = 'Retake';
        } else {
            captureBtn.innerHTML = '📸';
            captureLabel.textContent = 'Capture';
        }
    }

    updatePosePilotButton() {
        const btn = document.getElementById('pose-pilot-btn');
        const label = document.getElementById('pose-pilot-label');
        const icon = document.getElementById('pose-pilot-icon');
        
        // Remove all state classes
        btn.classList.remove('processing', 'interaction', 'angle', 'go-bold', 'original');
        
        if (!this.capturedImageData) {
            btn.disabled = true;
            label.textContent = 'Take a photo first';
            icon.textContent = '🤖';
        } else if (this.isProcessing) {
            btn.disabled = true;
            btn.classList.add('processing');
            label.textContent = 'Processing...';
            icon.textContent = '⚡';
        } else if (this.generatedImages.length === 0) {
            btn.disabled = false;
            label.textContent = 'Get AI suggestions';
            icon.textContent = '🤖';
        } else if (this.currentImageIndex === 0) {
            btn.disabled = false;
            const suggestion = this.suggestions[0];
            const { className, emoji } = this.getSuggestionStyle(suggestion);
            btn.classList.add(className);
            label.textContent = this.capitalizeType(suggestion?.type) || 'Angle';
            icon.textContent = emoji;
        } else if (this.currentImageIndex < this.generatedImages.length) {
            btn.disabled = false;
            const suggestion = this.suggestions[this.currentImageIndex];
            const { className, emoji } = this.getSuggestionStyle(suggestion);
            btn.classList.add(className);
            label.textContent = this.capitalizeType(suggestion?.type) || 'Suggestion';
            icon.textContent = emoji;
        } else {
            btn.disabled = false;
            btn.classList.add('original');
            label.textContent = 'View original';
            icon.textContent = '📷';
        }
    }

    getSuggestionStyle(suggestion) {
        if (!suggestion) return { className: 'interaction', emoji: '🤝' };
        
        const type = suggestion.type;
        
        switch (type) {
            case 'interaction':
                return { className: 'interaction', emoji: '🤝' };
            case 'angle':
                return { className: 'angle', emoji: '📐' };
            case 'go-bold':
                return { className: 'go-bold', emoji: '🚀' };
            default:
                return { className: 'interaction', emoji: '✨' };
        }
    }

    capitalizeType(type) {
        if (!type) return '';
        
        switch (type) {
            case 'angle':
                return 'Angle';
            case 'interaction':
                return 'Interaction';
            case 'go-bold':
                return 'Go Bold';
            default:
                return type.charAt(0).toUpperCase() + type.slice(1);
        }
    }

    showPoseIQ() {
        const overlay = document.getElementById('poseiq-overlay');
        const number = document.getElementById('poseiq-number');
        const comment = document.getElementById('poseiq-comment');
        
        if (this.poseIQ) {
            number.textContent = this.poseIQ.score;
            comment.textContent = this.poseIQ.comment;
            overlay.style.display = 'block';
        }
        
        this.updatePoseIQSuggestion();
    }

    updatePoseIQSuggestion() {
        const suggestionDiv = document.getElementById('poseiq-suggestion');
        const titleDiv = document.getElementById('suggestion-title');
        const increaseDiv = document.getElementById('suggestion-increase');
        
        // Show suggestion info when viewing AI images
        if (this.currentImageIndex > 0 && this.currentImageIndex <= this.suggestions.length) {
            const suggestion = this.suggestions[this.currentImageIndex - 1];
            if (suggestion) {
                titleDiv.textContent = suggestion.title;
                increaseDiv.textContent = `+${suggestion.scoreIncrease} points`;
                suggestionDiv.style.display = 'block';
            }
        } else {
            suggestionDiv.style.display = 'none';
        }
    }

    hidePoseIQ() {
        const overlay = document.getElementById('poseiq-overlay');
        overlay.style.display = 'none';
    }

    showPosePilotLoading() {
        const loading = document.getElementById('pose-pilot-loading');
        const icon = document.getElementById('pose-pilot-icon');
        
        loading.style.display = 'flex';
        icon.style.display = 'none';
    }

    hidePosePilotLoading() {
        const loading = document.getElementById('pose-pilot-loading');
        const icon = document.getElementById('pose-pilot-icon');
        
        loading.style.display = 'none';
        icon.style.display = 'block';
    }

    showBackButton() {
        const backBtn = document.getElementById('back-to-original');
        backBtn.style.display = 'flex';
    }

    hideBackButton() {
        const backBtn = document.getElementById('back-to-original');
        backBtn.style.display = 'none';
    }

    saveApiKeys() {
        const openaiKey = document.getElementById('openai-key-input').value.trim();
        const geminiKey = document.getElementById('gemini-key-input').value.trim();
        
        if (openaiKey && geminiKey) {
            this.config.openaiApiKey = openaiKey;
            this.config.geminiApiKey = geminiKey;
            
            localStorage.setItem('posepilot_openai_key', openaiKey);
            localStorage.setItem('posepilot_gemini_key', geminiKey);
            
            document.getElementById('api-key-modal').style.display = 'none';
            console.log('✅ API keys saved');
        } else {
            this.showError('Please enter both API keys');
        }
    }

    enableDemoMode() {
        this.config.demoMode = true;
        document.getElementById('api-key-modal').style.display = 'none';
        console.log('🎭 Demo mode enabled');
    }

    showError(message) {
        // Simple alert for now - could be improved with a custom modal
        alert(message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.posePilotApp = new PosePilotApp();
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}