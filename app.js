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
        modal.classList.remove('hidden');
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
        video.classList.add('hidden');
        capturedImage.classList.remove('hidden');
        aiGeneratedImage.classList.add('hidden');
        
        // Update UI
        this.updateCaptureButton();
        this.updatePosePilotButton();
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
        capturedImage.classList.remove('hidden');
        video.classList.add('hidden');
        
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
        video.classList.remove('hidden');
        capturedImage.classList.add('hidden');
        aiGeneratedImage.classList.add('hidden');
        
        // Update UI
        this.updateCaptureButton();
        this.updatePosePilotButton();
        this.hidePoseIQ();
        
        console.log('🔄 Photo retaken');
    }

    async startAIProcessing() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.updatePosePilotButton(); // Update button to show processing state
        this.showPosePilotLoading(); // Show loading spinner
        
        try {
            // Get AI suggestions
            await this.getChatGPTSuggestions();
            
            // Generate AI images
            await this.generateAIImages();
            
            // Show first AI image (Angle) and set current index
            this.showAIImage(0);
            this.currentImageIndex = 1; // Start at Angle (index 1)
            
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
        console.log('🍌 Generating AI images in parallel...');
        
        this.generatedImages = [];
        
        // Create all three requests simultaneously
        const imagePromises = [];
        
        for (let i = 0; i < 3; i++) {
            const prompt = this.createNanoBananaPrompt(this.suggestions[i]);
            
            const imagePromise = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${this.config.geminiApiKey}`, {
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
            })
            .then(response => response.json())
            .then(data => {
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
                        console.log(`✅ Successfully generated image ${i + 1}/3`);
                        return {
                            url: dataUrl,
                            suggestion: this.suggestions[i],
                            index: i
                        };
                    } else {
                        console.error(`❌ No image data found in response ${i + 1}`);
                        return null;
                    }
                } else {
                    console.error(`❌ Invalid response from Nano Banana for image ${i + 1}`);
                    return null;
                }
            })
            .catch(error => {
                console.error(`❌ Error generating image ${i + 1}:`, error);
                return null;
            });
            
            imagePromises.push(imagePromise);
        }
        
        console.log('🚀 Launched all 3 requests simultaneously...');
        
        // Wait for all requests to complete
        try {
            const results = await Promise.all(imagePromises);
            
            // Filter out null results and sort by original index to maintain order
            const validResults = results.filter(result => result !== null);
            validResults.sort((a, b) => a.index - b.index);
            
            // Store the generated images in the correct order
            this.generatedImages = validResults.map(result => ({
                url: result.url,
                suggestion: result.suggestion
            }));
            
            console.log(`✅ Completed parallel generation: ${this.generatedImages.length}/3 images successful`);
            
        } catch (error) {
            console.error('❌ Error in parallel image generation:', error);
        }
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
        aiImage.classList.remove('hidden');
        capturedImage.classList.add('hidden');
        
        this.currentImageIndex = index + 1; // +1 because 0 is original
        this.updatePosePilotButton();
        this.updatePoseIQSuggestion();
    }

    showOriginalPhoto() {
        const aiImage = document.getElementById('ai-generated-image');
        const capturedImage = document.getElementById('captured-image');
        
        aiImage.classList.add('hidden');
        capturedImage.classList.remove('hidden');
        
        this.currentImageIndex = 0;
        this.updatePosePilotButton();
        this.updatePoseIQSuggestion();
    }

    cycleToNextImage() {
        if (this.generatedImages.length === 0) return;
        
        if (this.currentImageIndex === 1) {
            // Currently showing Angle, next is Interaction
            this.showAIImage(1);
            this.currentImageIndex = 2;
        } else if (this.currentImageIndex === 2) {
            // Currently showing Interaction, next is Go Bold
            this.showAIImage(2);
            this.currentImageIndex = 3;
        } else if (this.currentImageIndex === 3) {
            // Currently showing Go Bold, next is Original
            this.showOriginalPhoto();
            this.currentImageIndex = 4;
        } else {
            // Currently showing Original, restart cycle to Angle
            this.showAIImage(0);
            this.currentImageIndex = 1;
        }
        
        this.updatePosePilotButton();
    }

    updateCaptureButton() {
        const captureBtn = document.getElementById('capture-btn');
        const captureLabel = document.getElementById('capture-label');
        
        if (this.capturedImageData) {
            // Show retake state
            captureBtn.innerHTML = `
                <div class="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-600">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M8 16H3v5"/>
                    </svg>
                </div>
            `;
            captureLabel.textContent = 'Retake';
        } else {
            // Show camera state
            captureBtn.innerHTML = `
                <div class="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-600">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                    </svg>
                </div>
            `;
            captureLabel.textContent = 'Capture';
        }
    }

    updatePosePilotButton() {
        const btn = document.getElementById('pose-pilot-btn');
        const label = document.getElementById('pose-pilot-label');
        const icon = document.getElementById('pose-pilot-icon');
        const loading = document.getElementById('pose-pilot-loading');
        
        // Reset button style but keep the AI icon unchanged
        btn.className = 'w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-95 transition-all duration-200 shadow-lg disabled:opacity-50 relative z-10';
        
        // Reset loading and icon visibility
        if (loading) loading.classList.add('hidden');
        if (icon) icon.classList.remove('hidden');
        
        if (!this.capturedImageData && !this.uploadedImageData) {
            btn.disabled = true;
            label.textContent = 'Take a photo first';
            this.resetSegmentRing();
        } else if (this.isProcessing) {
            btn.disabled = true;
            label.textContent = 'Processing...';
            // Don't reset loading/icon here - let showPosePilotLoading handle it
        } else if (this.generatedImages.length === 0) {
            btn.disabled = false;
            label.textContent = 'Get AI suggestions';
            this.resetSegmentRing();
        } else if (this.currentImageIndex === 1) {
            // Showing Angle image
            btn.disabled = false;
            label.textContent = 'Angle';
            this.activateSegment('angle');
        } else if (this.currentImageIndex === 2) {
            // Showing Interaction image
            btn.disabled = false;
            label.textContent = 'Interaction';
            this.activateSegment('interaction');
        } else if (this.currentImageIndex === 3) {
            // Showing Go Bold image
            btn.disabled = false;
            label.textContent = 'Go Bold';
            this.activateSegment('go-bold');
        } else if (this.currentImageIndex === 4) {
            // Showing Original image
            btn.disabled = false;
            label.textContent = 'Original';
            this.activateSegment('original');
        } else {
            // Default state
            btn.disabled = false;
            label.textContent = 'Get AI suggestions';
            this.resetSegmentRing();
        }
    }
    
    resetSegmentRing() {
        // Reset all segments to inactive state
        const segments = ['segment-original', 'segment-angle', 'segment-interaction', 'segment-gobold'];
        segments.forEach(segmentId => {
            const segment = document.getElementById(segmentId);
            if (segment) {
                segment.style.opacity = '0.3';
            }
        });
    }
    
    activateSegment(type) {
        // First reset all segments
        this.resetSegmentRing();
        
        // Map suggestion types to segment IDs
        const segmentMap = {
            'angle': 'segment-angle',
            'interaction': 'segment-interaction', 
            'go bold': 'segment-gobold',
            'go-bold': 'segment-gobold',
            'original': 'segment-original'
        };
        
        const segmentId = segmentMap[type?.toLowerCase()];
        if (segmentId) {
            const segment = document.getElementById(segmentId);
            if (segment) {
                segment.style.opacity = '1';
            }
        }
    }

    getSuggestionStyle(suggestion) {
        if (!suggestion) return { bgClass: 'bg-ios-purple', shadowClass: 'shadow-ios-purple/40', emoji: '🤝' };
        
        const type = suggestion.type;
        
        switch (type) {
            case 'interaction':
                return { bgClass: 'bg-ios-purple', shadowClass: 'shadow-ios-purple/40', emoji: '🤝' };
            case 'angle':
                return { bgClass: 'bg-ios-blue', shadowClass: 'shadow-ios-blue/40', emoji: '📐' };
            case 'go-bold':
                return { bgClass: 'bg-ios-red', shadowClass: 'shadow-ios-red/40', emoji: '🚀' };
            default:
                return { bgClass: 'bg-ios-purple', shadowClass: 'shadow-ios-purple/40', emoji: '✨' };
        }
    }

    getSuggestionIcon(suggestion) {
        if (!suggestion) {
            return `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M8.5 14.5A4 4 0 0 0 12 16a4 4 0 0 0 3.5-1.5"/>
                </svg>
            `;
        }
        
        const type = suggestion.type;
        
        switch (type) {
            case 'interaction':
                return `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                `;
            case 'angle':
                return `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white">
                        <path d="M9 9 5 5v4h4"/>
                        <path d="M15 15l4 4v-4h-4"/>
                        <path d="M5 19h14"/>
                        <path d="M19 5v14"/>
                    </svg>
                `;
            case 'go-bold':
                return `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white">
                        <path d="M8 2v20l11-10L8 2z"/>
                    </svg>
                `;
            default:
                return `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M8.5 14.5A4 4 0 0 0 12 16a4 4 0 0 0 3.5-1.5"/>
                    </svg>
                `;
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
            overlay.classList.remove('hidden');
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
                suggestionDiv.classList.remove('hidden');
            }
        } else {
            suggestionDiv.classList.add('hidden');
        }
    }

    hidePoseIQ() {
        const overlay = document.getElementById('poseiq-overlay');
        overlay.classList.add('hidden');
    }

    showPosePilotLoading() {
        const loading = document.getElementById('pose-pilot-loading');
        const icon = document.getElementById('pose-pilot-icon');
        
        console.log('🔄 Showing loading spinner...', { loading, icon });
        if (loading) {
            loading.classList.remove('hidden');
            console.log('✅ Loading spinner shown');
        } else {
            console.error('❌ Loading spinner element not found');
        }
        if (icon) {
            icon.classList.add('hidden');
            console.log('✅ Icon hidden');
        }
    }

    hidePosePilotLoading() {
        const loading = document.getElementById('pose-pilot-loading');
        const icon = document.getElementById('pose-pilot-icon');
        
        console.log('🔄 Hiding loading spinner...', { loading, icon });
        if (loading) {
            loading.classList.add('hidden');
            console.log('✅ Loading spinner hidden');
        }
        if (icon) {
            icon.classList.remove('hidden');
            console.log('✅ Icon shown');
        }
    }


    saveApiKeys() {
        const openaiKey = document.getElementById('openai-key-input').value.trim();
        const geminiKey = document.getElementById('gemini-key-input').value.trim();
        
        if (openaiKey && geminiKey) {
            this.config.openaiApiKey = openaiKey;
            this.config.geminiApiKey = geminiKey;
            
            localStorage.setItem('posepilot_openai_key', openaiKey);
            localStorage.setItem('posepilot_gemini_key', geminiKey);
            
            document.getElementById('api-key-modal').classList.add('hidden');
            console.log('✅ API keys saved');
        } else {
            this.showError('Please enter both API keys');
        }
    }

    enableDemoMode() {
        this.config.demoMode = true;
        document.getElementById('api-key-modal').classList.add('hidden');
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