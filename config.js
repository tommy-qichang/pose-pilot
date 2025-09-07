// Configuration file for Pose Pilot
// Users should update this file with their API keys

const CONFIG = {
    // OpenAI API Configuration
    OPENAI_API_KEY: '', // Add your OpenAI API key here
    OPENAI_MODEL: 'gpt-4o',
    
    // Google Gemini API Configuration  
    GEMINI_API_KEY: '', // Add your Gemini API key here
    GEMINI_MODEL: 'gemini-2.5-flash-image-preview',
    
    // App Configuration
    MAX_IMAGE_SIZE: 1024 * 1024, // 1MB max image size
    JPEG_QUALITY: 0.8,
    
    // Demo Mode (set to true to use without API keys)
    DEMO_MODE: false
};

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
