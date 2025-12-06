# Job Matcher Chrome Extension

A powerful Chrome Extension that uses **Google Gemini AI** to match your resume with job descriptions on popular job boards like LinkedIn and Reed.co.uk.

## Features

-   **AI-Powered Matching**: Uses Google's Gemini models (supports `Gemini 2.5 Pro` and `2.5 Flash Preview`) to analyze compatibility.
-   **Dual Scoring System**:
    -   **Job Match Score**: Pure fit between skills/experience and job requirements.
    -   **ATS Score**: Optimization level for Applicant Tracking Systems.
-   **Smart Integration**: Automatically detects job descriptions on **LinkedIn** and **Reed.co.uk**.
-   **Universal Fallback**: Works on almost any other job site by extracting the main page content.
-   **Multi-Language Support**: Fully localized for **English** and **Traditional Chinese (繁體中文)**.
-   **Privacy Focused**: Your API Key is stored locally in your browser.

## Workflow

1.  **Installation**: Load the extension in Chrome (Unpacked).
2.  **Setup**:
    *   Open the side panel.
    *   Click the **Gear ⚙️ Icon** to open Settings.
    *   Enter your **Gemini API Key**.
    *   Choose your preferred **AI Model** and **Language**.
    *   Click **Save**.
3.  **Profile**:
    *   Paste your **Resume** text into the "Resume" tab.
    *   (Optional) Add extra details in "Additional Info" (e.g., "I prefer remote work").
4.  **Matching**:
    *   Navigate to a job page (e.g., on LinkedIn).
    *   The extension will automatically detect the job.
    *   Click **"Analyze Match"** (or "分析配對程度").
    *   View your **Compatibility Score** and detailed **AI Reasoning**.

## Technology Stack

-   **Frontend**: HTML5, CSS3 (Modern Variables & Flexbox), Vanilla JavaScript.
-   **Extension API**: Manifest V3, Side Panel API, Scripting API.
-   **AI Integration**: Google Generative Language API (Gemini).

## Installation

1.  Clone or download this repository.
2.  Open Chrome and go to `chrome://extensions`.
3.  Enable **Developer mode** (toggle in top right).
4.  Click **Load unpacked**.
5.  Select the `Job_Matcher` folder.

## Updates

*Last Updated: 2025-12-06*
- Added Internationalization (EN/ZH-TW).
- Added Model Selection.
- Improved UI/UX with premium styling.
