# 📸 Pose Pilot - AI Photo Guidance

**A mobile web app for AI-powered pose recommendation and real-time photo guidance**

Built for the [**Nano Banana 48 Hour Challenge**](https://www.kaggle.com/competitions/banana) using ChatGPT and Nano Banana APIs.

## ✨ Features

- 📱 **Mobile-First Design** - Optimized for iPhone Safari and mobile browsers
- 📷 **Camera Integration** - Front/back camera support with photo capture
- 🤖 **AI-Powered Analysis** - ChatGPT analyzes your photos and provides detailed suggestions
- 🎨 **Visual Examples** - Nano Banana generates improved photo examples
- 💡 **2 Key Suggestions** per photo:
  - Camera View & Position
  - Object Interaction
  - Lighting & Exposure  
  - Background & Depth
- 🚀 **PWA Support** - Install as an app on your phone
- 🔒 **Privacy-First** - API keys stored locally, photos processed client-side

## 🎯 Perfect For

- Photography enthusiasts wanting to improve their skills
- Content creators seeking better composition
- Social media users looking for professional-quality photos
- Anyone wanting AI-powered photo guidance

**Go Bananas!** For 48 hours, starting on September 6, 2025, we are unlocking a special 48-hour free tier of the Gemini API, putting Gemini 2.5 Flash Image Preview (aka Nano Banana), our state-of-the-art image model, into your hands. In collaboration with Fal and ElevenLabs, we're giving over $400,000 of prizes! We're looking forward to seeing what you build in the next two days!

Nano Banana is about dynamic creation. Edit with words, blend realities, and access Gemini's unique world knowledge. We challenge you to unleash this power. Show us an application that transforms how we interact with visuals and deliver something that wasn't possible before.

### Quick Navigation

- [🚀 Get Started in 3 Steps](#-get-started-in-3-steps)
- [🎯 The Challenge](#-the-challenge)
- [🛠️ Technical Resources](#️-technical-resources)
- [🏆 Submission \& Judging](#-submission--judging)
- [🗓️ Timeline \& Prizes](#️-timeline--prizes)
- [💬 Getting Help \& Discussion](#-getting-help--discussion)

## 🚀 Quick Start

### 1. Get API Keys
- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Follow the **[API Key Guide](./guides/01-getting-your-api-key.ipynb)** for Nano Banana access

### 2. Run the App
```bash
# Clone and serve
git clone <repository-url>
cd pose-pilot

# Option 1: Python HTTPS server (recommended for mobile)
python server.py

# Option 2: Simple HTTP server  
python -m http.server 8000

# Option 3: Node.js
npx serve .
```

### 3. Test on Mobile
- Open `https://localhost:8443` (or your server URL)
- Accept certificate warning
- Allow camera permissions
- Add to home screen for full app experience

### 4. Submit to Competition
When ready, submit to the **[Official Kaggle Competition](https://www.kaggle.com/competitions/banana)**

## 📱 How It Works

1. **📸 Capture Photo** - Use your phone's camera to take a photo
2. **🤖 AI Analysis** - ChatGPT analyzes composition, lighting, and pose
3. **💡 Get Suggestions** - Receive 2 detailed improvement recommendations
4. **✨ See Examples** - Nano Banana generates improved photo examples
5. **📈 Improve Skills** - Apply suggestions to take better photos

## 🛠️ Technical Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **AI APIs**: OpenAI GPT-4 Vision + Google Gemini (Nano Banana)  
- **Camera**: MediaDevices API with mobile optimization
- **PWA**: Service Worker + Web App Manifest
- **Mobile**: iOS Safari optimized, responsive design

## 📋 Project Structure

```
pose-pilot/
├── index.html          # Main app interface
├── styles.css          # Mobile-optimized styling  
├── app.js             # Core application logic
├── config.js          # API configuration
├── manifest.json      # PWA manifest
├── sw.js             # Service worker
├── server.py         # HTTPS development server
├── SETUP.md          # Detailed setup guide
└── README.md         # This file
```

## 🎯 The Challenge

Your mission is to build a product, application, or demo that showcases one or more of these core strengths. Think beyond simple text-to-image. How can these advanced features create a magical user experience?

Consider applications that:

*   Enhance dynamic storytelling (e.g., consistent character comics).
*   Revolutionize e-commerce (e.g., virtual room placement or product visualization).
*   Automate creative workflows (e.g., personalized marketing assets at scale).
*   Build the next generation of natural language photo editors.

## 🛠️ Technical Resources

*   **[START HERE: Getting Your API Key](./guides/01-getting-your-api-key.ipynb)**: Step-by-step instructions to get your free Gemini API key and generate a first image with nano banana using Python.
    *   **[Use Nano banana](./guides/02-use-nano-banana.ipynb)**: Learn of the different ways to use nano banana, to generate and edit images.   
*   **[`examples/`](./examples/)**: Self-contained code snippets demonstrating specific features of the Gemini API.
    *  [JavaScript Getting Started](./examples/javascript-getting-started.md)
*   🌐 **Official Nano Banana Gemini API Docs**: https://ai.google.dev/gemini-api/docs/image-generation
*   ✍️ **Prompting Guide & Strategies**: https://ai.google.dev/gemini-api/docs/image-generation#prompt-guide
*   🍳 **Cookbooks (Advanced Recipes)**:
    *   **Python**: [Quickstart with Image understanding (Colab)](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Image_out.ipynb)
    *   **JavaScript**: [Get Started with Image understanding (AI Studio)](https://aistudio.google.com/apps/bundled/get_started_image_out)
*   ✨ **Inspirational Applets**: See what's possible with these interactive demos.
    *   [GemBooth](https://aistudio.google.com/apps/bundled/gembooth)
    *   [Home Canvas](https://aistudio.google.com/apps/bundled/home_canvas)
    *   [Past Forward](https://aistudio.google.com/apps/bundled/past_forward)
    *   [PixShop](https://aistudio.google.com/apps/bundled/pixshop)

### Partner Resources 🤝

Explore the tools and platforms from our partners to enhance your project.

#### ElevenLabs

*   [Get started with the ElevenLabs API](https://elevenlabs.io/docs/quickstart)
*   [Get started with ElevenLabs Agents](https://elevenlabs.io/docs/agents-platform/overview)
*   [Show us your projects](https://showcase.elevenlabs.io/)
*   [Follow for updates on X](https://x.com/ElevenLabsDevs)
*   [Watch on YouTube](https://www.youtube.com/@elevenlabsio)

#### fal.ai

*   Create an account at [fal.ai](https://fal.ai/?utm_source=chatgpt.com)
*   Generate your API [Keys](https://fal.ai/dashboard/keys) after logging in
*   Start building: JavaScript and Python snippets can be found [here](https://docs.fal.ai/model-apis/quickstart?utm_source=chatgpt.com)



## 🏆 Submission & Judging

Your project will be judged primarily on your video demo. Show, don't just tell! We want to see the "wow" factor, the utility of your application, and the technical skill behind it.

### How to Submit
All submissions must be made through the official competition page:
> **[https://www.kaggle.com/competitions/banana](https://www.kaggle.com/competitions/banana)**

### Submission Requirements
Your complete Kaggle submission must include:

1.  **🎥 The Video Demo (2 minutes or less)**
    *   An engaging video demonstrating your project. It must be posted publicly (e.g., YouTube, X/Twitter) and viewable without a login.

2.  **🔗 Public Project Link**
    *   A URL to your working product or interactive demo. If a live demo isn't feasible, a link to your public code repository (e.g., GitHub) with clear setup instructions is required.

3.  **✍️ Gemini Integration Write-up (max 200 words)**
    *   A brief description detailing which Gemini 2.5 Flash Image features you used and how they are central to your application.

### Judging Criteria
*   💡 **Innovation and "Wow" Factor (40%)**: How creative and novel is the application? Does it leverage Gemini 2.5 Flash Image in a way that wasn't previously possible?
*   ⚙️ **Technical Execution and Functionality (30%)**: Does the application work? How effectively does it utilize the API's advanced features (consistency, fusion, editing)?
*   📈 **Potential Impact and Utility (20%)**: Does the application solve a real-world problem (creative, commercial, or educational)?
*   🎬 **Presentation Quality (10%)**: Clarity, storytelling, and engagement of the video demo.

For the Special Technology Prize, these same criteria will be applied with a focus on how that specific technology (ElevenLabs) was pivotal in achieving the project's impact and technical excellence.


## 🗓️ Timeline & Prizes

### 💰 Prizes
Compete for your share of over **$400,000 in prizes**!

**Overall Track**
*   **Top 50 Submissions**: $5,000 in Gemini API Credits each + $1,000 in Fal credits, and 11 million (approx. US $2,000) ElevenLabs Credits.

**Special Technology Prize - ElevenLabs**
*   **Winner**: 22M ElevenLabs Credits (6 months of Scale, Approx value: $4,000)

### ⏳ Key Dates
*   **Competition Starts**: September 6, 2025 (12:01am UTC, September 5, 2025 5:00 PM PT)
*   **Final Submission Deadline**: September 7, 2025 (4:59 PM UTC, 11:59 PM PT)
*   **Judging Period**: September 8 - 17, 2025
*   **Winners Announced**: September 19, 2025 (Estimated)

*Time required to evaluate results is dependent on the number of submissions. All deadlines are at 11:59 PM UTC on the corresponding day unless otherwise noted. The organizers reserve the right to update the timeline.*

## Notes About API Usage

Please note the special tier for the Gemini API (for all API users) - will allow **200 requests per project per day.** 

Developers using a paid API key will pay for all of their usage. To get the free 200 generations, please use a free tier API key.

## 💬 Getting Help & Discussion

All questions, team formation, and discussions will take place on the Kaggle platform. This is the best place to get help from organizers, mentors, and the community.

*   **Ask a question:** Post your technical or general questions for the community and organizers.
*   **Find teammates:** Create a post to look for collaborators.
*   **Share your ideas:** Discuss your project concepts and get feedback.

> **[Go to the Official Kaggle Discussion Forum](https://www.kaggle.com/competitions/banana/discussion)**

Happy Hacking!
