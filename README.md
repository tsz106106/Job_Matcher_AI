# Job Matcher AI - Chrome Extension

A powerful Chrome Extension that uses **Google Gemini AI** to analyze how well your resume matches job descriptions. Get detailed scoring with actionable pros/cons for each evaluation dimension.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green) ![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue) ![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange)

## ✨ Features

### 🎯 Intelligent Scoring System
- **Job Match Score (0-100)**: Evaluates 5 dimensions:
  - Hard Skills, Soft Skills, Experience Alignment, Education & Certification, Semantic Similarity
- **ATS Score (0-100)**: Evaluates 4 dimensions:
  - Keyword Alignment, Formatting Structure, Section Structure, Language Compliance
- **Overall Fit Score**: Weighted combination (70% Job + 30% ATS)

### 📊 Detailed Analysis
- **Pros & Cons** for each dimension explaining what's strong and what needs improvement
- **Final Suggestion** with interview likelihood assessment
- All analysis text generated in your selected language

### 🌐 Smart Job Detection
- **LinkedIn**: Automatic job description extraction
- **Reed.co.uk**: Native support
- **Universal Fallback**: Works on any job site by extracting main content

### 🎨 Modern iOS-Style UI
- Animated progress rings
- Clean, responsive design
- Dark mode friendly

### 🌍 Multi-Language Support
- **English**
- **繁體中文 (Traditional Chinese)**

## 🚀 Installation

1. Clone or download this repository
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (toggle top right)
4. Click **Load unpacked**
5. Select the `Job_Matcher` folder

## ⚙️ Setup

1. Open the extension side panel
2. Go to **Settings** (gear icon)
3. Enter your **Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))
4. Choose your **AI Model** and **Language**
5. Click **Save**

## 📝 Usage

1. **Profile Tab**: Paste your resume text
2. **Match Tab**: Navigate to a job page
3. Click **Analyze Match**
4. Review your scores and detailed analysis

## 🛠 Technology Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Extension API**: Manifest V3, Side Panel API, Scripting API
- **AI**: Google Generative Language API (Gemini 2.5 Pro / Flash)
- **Build**: Tailwind CSS CLI

## 📁 Project Structure

```
Job_Matcher/
├── manifest.json          # Extension configuration
├── sidepanel.html         # Main UI
├── sidepanel.js           # Core logic & AI integration
├── translations.js        # i18n strings (EN/ZH-TW)
├── background.js          # Service worker
├── content_*.js           # Job extraction scripts
├── src/input.css          # Tailwind source
├── styles.css             # Compiled CSS
└── tailwind.config.js     # Tailwind configuration
```

## 🔒 Privacy

- Your API key is stored locally in Chrome storage
- Resume data never leaves your browser except for AI analysis
- No tracking or analytics

## 📄 License

MIT License

---

*Last Updated: 2025-12-06*
