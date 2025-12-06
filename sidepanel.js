document.addEventListener('DOMContentLoaded', () => {
    // State
    let apiKey = '';
    let currentModel = 'gemini-2.5-pro';
    let currentLanguage = 'en';
    const state = {
        resume: '',
        additionalInfo: '',
        jobDescription: null,
        jobTitle: null,
        jobUrl: null
    };

    // Elements
    // Removed old settingsBtn (now implicit in nav)
    // Removed settingsPanel ID (now inline section)
    const settingsSection = document.getElementById('settings-section');
    const apiKeyInput = document.getElementById('apiKey');
    const modelSelect = document.getElementById('modelSelect');
    const languageSelect = document.getElementById('languageSelect');
    const saveSettingsBtn = document.getElementById('save-settings');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const resumeInput = document.getElementById('resume-text');
    const infoInput = document.getElementById('additional-info');
    const matchBtn = document.getElementById('match-btn');
    const jobStatus = document.getElementById('job-status');
    const jobDetails = document.getElementById('job-details');
    const jobTitleEl = document.getElementById('job-title');
    const jobCompanyEl = document.getElementById('job-company');
    const resultsSection = document.getElementById('results-section');
    const scoreText = document.getElementById('score-text');
    const scoreCirclePath = document.getElementById('score-circle-path');
    const jobAnalysisText = document.getElementById('job-analysis-text');
    const atsAnalysisText = document.getElementById('ats-analysis-text');
    const refreshJobBtn = document.getElementById('refresh-job');
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    // Load Settings
    chrome.storage.sync.get(['geminiApiKey', 'userResume', 'userInfo', 'selectedModel', 'selectedLanguage'], (result) => {
        if (result.geminiApiKey) {
            apiKey = result.geminiApiKey;
            apiKeyInput.value = apiKey;
        } else {
            // If no API key, maybe switch to profile view automatically?
            // For now, let's just let user discover it.
            // Or indicate notification dot?
        }

        if (result.selectedModel) {
            currentModel = result.selectedModel;
            modelSelect.value = currentModel;
        }

        if (result.selectedLanguage) {
            currentLanguage = result.selectedLanguage;
            languageSelect.value = currentLanguage;
        }

        applyTranslations();
        if (result.userResume) {
            state.resume = result.userResume;
            resumeInput.value = state.resume;
        }

        if (result.userInfo) {
            state.additionalInfo = result.userInfo;
            infoInput.value = state.additionalInfo;
        }

        updateButtonState();
    });

    // Event Listeners
    // Removed old settingsBtn listener

    saveSettingsBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        const model = modelSelect.value;
        const lang = languageSelect.value;

        if (key) {
            apiKey = key;
            currentModel = model;
            currentLanguage = lang;
            chrome.storage.sync.set({
                geminiApiKey: key,
                selectedModel: model,
                selectedLanguage: lang
            }, () => {
                alert("Settings Saved!"); // Simple feedback since we are not hiding a panel anymore
                applyTranslations();
                updateButtonState();
            });
        }
    });

    // Navigation
    navItems.forEach(nav => {
        nav.addEventListener('click', () => {
            // Update Nav State
            navItems.forEach(n => {
                // Reset to inactive styles
                n.classList.remove('text-primary', 'active');
                n.classList.add('text-slate-400', 'hover:text-slate-600');
            });
            // Set active styles
            nav.classList.remove('text-slate-400', 'hover:text-slate-600');
            nav.classList.add('text-primary', 'active');

            // Update View State
            const viewId = nav.dataset.view;
            viewSections.forEach(section => {
                // Hide all
                section.classList.add('hidden');
                section.classList.remove('flex'); // assuming flex layout for profile

                if (section.id === `view-${viewId}`) {
                    // Show target
                    section.classList.remove('hidden');
                    // Add layout specific class if needed (profile and settings need flex-col)
                    if (viewId === 'profile' || viewId === 'settings') section.classList.add('flex');
                }
            });
        });
    });

    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset Tabs
            tabBtns.forEach(b => {
                b.classList.remove('bg-white', 'text-black', 'shadow-sm'); // Active styles
                b.classList.add('text-slate-500', 'hover:text-black'); // Inactive styles
            });
            tabContents.forEach(c => {
                c.classList.add('hidden');
                c.classList.remove('block');
            });

            // Activate Target
            btn.classList.remove('text-slate-500', 'hover:text-black');
            btn.classList.add('bg-white', 'text-black', 'shadow-sm');

            const targetContent = document.getElementById(`${btn.dataset.tab}-tab-content`); // Note: HTML ID might need checking
            if (targetContent) {
                targetContent.classList.remove('hidden');
                targetContent.classList.add('block');
            }
        });
    });

    // Inputs
    resumeInput.addEventListener('input', (e) => {
        state.resume = e.target.value;
        chrome.storage.sync.set({ userResume: state.resume });
        updateButtonState();
    });

    infoInput.addEventListener('input', (e) => {
        state.additionalInfo = e.target.value;
        chrome.storage.sync.set({ userInfo: state.additionalInfo });
    });

    refreshJobBtn.addEventListener('click', () => {
        requestJobDetails();
    });

    matchBtn.addEventListener('click', async () => {
        const t = translations[currentLanguage];
        if (!apiKey) {
            alert(t.alertNoKey);
            // Switch to profile view
            document.querySelector('[data-view="profile"]').click();
            return;
        }
        if (!state.resume) {
            alert(t.alertNoResume);
            // Switch to profile view
            document.querySelector('[data-view="profile"]').click();
            return;
        }
        if (!state.jobDescription) {
            alert(t.alertNoJob);
            return;
        }

        setLoading(true);
        try {
            const analysis = await analyzeMatch(state.resume, state.additionalInfo, state.jobDescription);
            displayResults(analysis);
        } catch (error) {
            console.error(error);
            alert('Error analyzing match: ' + error.message);
        } finally {
            setLoading(false);
        }
    });

    // Helpers
    function updateButtonState() {
        const t = translations[currentLanguage];

        if (!apiKey) {
            matchBtn.textContent = t.setApiKey;
            matchBtn.disabled = false;
            matchBtn.classList.add('warning-btn');
            return;
        }

        matchBtn.classList.remove('warning-btn');
        matchBtn.textContent = matchBtn.classList.contains('analyzing') ? t.analyzingBtn : t.analyzeBtn;

        if (!state.resume) {
            matchBtn.title = t.titleCompleteResume;
            matchBtn.disabled = true;
        } else if (!state.jobDescription) {
            matchBtn.title = t.titleNoJob;
            matchBtn.disabled = true;
        } else {
            matchBtn.title = "";
            matchBtn.disabled = false;
        }
    }

    function setLoading(isLoading) {
        const t = translations[currentLanguage];
        if (isLoading) {
            matchBtn.textContent = t.analyzingBtn;
            matchBtn.disabled = true;
            matchBtn.classList.add('analyzing');
            resultsSection.classList.add('hidden');
        } else {
            matchBtn.textContent = t.analyzeBtn;
            matchBtn.disabled = false;
            matchBtn.classList.remove('analyzing');
        }
    }

    function applyTranslations() {
        const t = translations[currentLanguage];
        if (!t) return;

        // Static Text
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.textContent = t[key];
        });

        // Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (t[key]) el.placeholder = t[key];
        });

        updateButtonState(); // refresh button text
    }

    // Messaging to Content Script
    function requestJobDetails() {
        const t = translations[currentLanguage] || translations['en'];
        jobStatus.textContent = t.statusConnecting;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                // Check if we can talk to the tab
                if (tabs[0].url.startsWith("chrome://")) {
                    jobStatus.textContent = t.statusSystemPage;
                    return;
                }

                chrome.tabs.sendMessage(tabs[0].id, { action: "getJobDetails" }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn("Connection error:", chrome.runtime.lastError.message);
                        jobStatus.innerHTML = t.statusNotConnected;
                        state.jobDescription = null;
                        updateButtonState();
                        return;
                    }

                    if (response && response.jobDescription) {
                        state.jobDescription = response.jobDescription;
                        state.jobTitle = response.jobTitle;
                        state.jobCompany = response.jobCompany;

                        jobStatus.classList.add('hidden');
                        jobDetails.classList.remove('hidden');
                        jobTitleEl.textContent = state.jobTitle || 'Unknown Job';
                        jobCompanyEl.textContent = state.jobCompany || 'Unknown Company';
                        updateButtonState();
                    } else {
                        jobStatus.textContent = t.statusConnectedNoJob;
                    }
                });
            } else {
                jobStatus.textContent = t.statusNoTab;
            }
        });
    }

    // Auto-check when opening
    requestJobDetails();

    // AI Logic
    async function analyzeMatch(resume, info, jobDesc) {
        // Get language description for AI output
        const languageDescription = currentLanguage === 'zh-TW' ? 'Traditional Chinese (繁體中文)' : 'English';

        const prompt = `You are an evaluation engine. Your task is to evaluate how well a resume matches a given job description using fixed scoring criteria.

The extension's current UI language is: ${languageDescription}.
You MUST write all human-readable text (pros and cons) in this language: ${languageDescription}.
The JSON keys themselves (like "score", "pros", "cons") must remain in English.

Return ONLY valid JSON using the schema below. Do NOT include explanations, comments, or any text outside the JSON.

For EACH dimension, you MUST return:
- "score": an integer from 0 to 5
- "pros": an array of short bullet-like strings (what is good)
- "cons": an array of short bullet-like strings (what is missing, weak, or risky)

SCORING SCALE (for all dimensions):
- 5 = Excellent match
- 4 = Strong match
- 3 = Moderate match
- 2 = Weak match
- 1 = Very weak
- 0 = Not matched or missing

You will evaluate 9 dimensions in total:

1) JOB MATCHING SCORE – 5 dimensions:

- "hard_skills"
  What to score:
    How well the resume includes the key technical / hard skills, tools, and technologies explicitly required in the job description.
  Pros (in ${languageDescription}):
    Mention correctly matched tools/skills, repeated relevant usage, strong alignment with core technical requirements.
  Cons (in ${languageDescription}):
    Missing critical tools, outdated tech, or only partial coverage of important hard skills.

- "soft_skills"
  What to score:
    Whether the resume shows soft skills that align with the job's requested soft skills (e.g., communication, teamwork, leadership).
  Pros:
    Reference bullets that clearly show collaboration, communication, leadership, ownership, etc.
  Cons:
    Mention if soft skills are generic, weakly evidenced, or absent.

- "experience_alignment"
  What to score:
    How well the candidate's job titles, responsibilities, industries, and years of experience match the job's expectations.
  Pros:
    Highlight matching titles, similar responsibilities, same/similar industry, appropriate seniority.
  Cons:
    Point out mismatched seniority, irrelevant industry, missing key responsibilities, or insufficient years of experience.

- "education_certification"
  What to score:
    Whether the resume meets required degrees, fields of study, certifications, or licenses listed in the job description.
  Pros:
    State when required degree/certification is present or exceeded.
  Cons:
    State when required credential is missing, unrelated, or unclear.

- "semantic_similarity"
  What to score:
    Overall contextual alignment between the resume and job description (beyond exact keywords) in terms of responsibilities, projects, and focus areas.
  Pros:
    Note when the resume "tells the same story" as the job, even with different words.
  Cons:
    Note when the resume feels focused on a very different type of work or domain.

2) ATS MATCHING SCORE – 4 dimensions:

- "keyword_alignment"
  What to score:
    How well important job-specific keywords (skills, tools, methods, domain terms, and job title variants) appear in the resume in relevant sections.
  Pros:
    Mention strong coverage of key terms and their presence in work experience bullets.
  Cons:
    Mention missing critical keywords or only superficial mention (e.g., only in a skills list).

- "formatting_structure"
  What to score:
    Whether the resume appears ATS-safe: simple layout, likely no tables/columns/graphics, and text that should convert cleanly to plain text.
  Pros:
    Indicate simple, clean, likely ATS-friendly formatting.
  Cons:
    Indicate potential issues like complex / multi-column layout, heavy design, or elements that might break parsing.

- "section_structure"
  What to score:
    Whether the resume uses standard headings (e.g., Summary, Work Experience, Education, Skills) so ATS and humans can easily locate sections.
  Pros:
    Mention clear, standard headings and logically grouped content.
  Cons:
    Mention missing or non-standard headings, or mixing unrelated content.

- "language_compliance"
  What to score:
    Whether the resume avoids keyword stuffing, hidden text, and unnatural, overly repetitive phrases, while remaining professional and clear.
  Pros:
    Mention natural, concise, clear phrasing with relevant keywords.
  Cons:
    Mention signs of keyword stuffing, vague phrases, or unclear language.

If there is not enough evidence for a dimension, assign a lower score (0–2) and reflect that in the cons.

=== INPUT DATA ===

JOB DESCRIPTION:
${jobDesc.substring(0, 4000)}

RESUME:
${resume.substring(0, 4000)}

ADDITIONAL INFO:
${info || 'None provided'}

=== RESPONSE FORMAT (JSON ONLY) ===

{
  "job_matching_score": {
    "dimensions": {
      "hard_skills": {
        "score": 0,
        "pros": ["string"],
        "cons": ["string"]
      },
      "soft_skills": {
        "score": 0,
        "pros": ["string"],
        "cons": ["string"]
      },
      "experience_alignment": {
        "score": 0,
        "pros": ["string"],
        "cons": ["string"]
      },
      "education_certification": {
        "score": 0,
        "pros": ["string"],
        "cons": ["string"]
      },
      "semantic_similarity": {
        "score": 0,
        "pros": ["string"],
        "cons": ["string"]
      }
    }
  },
  "ats_matching_score": {
    "dimensions": {
      "keyword_alignment": {
        "score": 0,
        "pros": ["string"],
        "cons": ["string"]
      },
      "formatting_structure": {
        "score": 0,
        "pros": ["string"],
        "cons": ["string"]
      },
      "section_structure": {
        "score": 0,
        "pros": ["string"],
        "cons": ["string"]
      },
      "language_compliance": {
        "score": 0,
        "pros": ["string"],
        "cons": ["string"]
      }
    }
  }
}

Rules:
- All "score" values MUST be integers between 0 and 5.
- All "pros" and "cons" arrays MUST contain 0 or more strings written in ${languageDescription}.
- Do NOT add any extra top-level keys or dimension names.
- Do NOT return anything outside this JSON object.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        let textToParse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textToParse) throw new Error("No response from AI");

        // More robust JSON cleanup
        // 1. Remove markdown code blocks if present
        textToParse = textToParse.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

        // 2. Find JSON boundaries
        const startIndex = textToParse.indexOf('{');
        const endIndex = textToParse.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            textToParse = textToParse.substring(startIndex, endIndex + 1);
        }

        // 3. Clean up any trailing commas before closing braces/brackets (common JSON error)
        textToParse = textToParse.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        try {
            const parsed = JSON.parse(textToParse);
            return calculateFinalScores(parsed);
        } catch (e) {
            console.error("JSON Parse Error:", e.message);
            console.error("Text that failed to parse:", textToParse.substring(0, 500));
            throw new Error("Failed to parse analysis results. Please try again.");
        }
    }

    function calculateFinalScores(data) {
        // Extract dimension objects from JSON (each has { score, pros, cons })
        const jobDim = data.job_matching_score.dimensions;
        const atsDim = data.ats_matching_score.dimensions;

        // Job Matching Score (0-100) with specified weights
        // hard_skills: 30%, soft_skills: 10%, experience_alignment: 25%,
        // education_certification: 15%, semantic_similarity: 20%
        const jobMatchTotal = Math.round(
            (jobDim.hard_skills.score / 5) * 30 +
            (jobDim.soft_skills.score / 5) * 10 +
            (jobDim.experience_alignment.score / 5) * 25 +
            (jobDim.education_certification.score / 5) * 15 +
            (jobDim.semantic_similarity.score / 5) * 20
        );

        // ATS Matching Score (0-100) with specified weights
        // keyword_alignment: 50%, formatting_structure: 20%,
        // section_structure: 20%, language_compliance: 10%
        const atsMatchTotal = Math.round(
            (atsDim.keyword_alignment.score / 5) * 50 +
            (atsDim.formatting_structure.score / 5) * 20 +
            (atsDim.section_structure.score / 5) * 20 +
            (atsDim.language_compliance.score / 5) * 10
        );

        // Overall Fit Score (0-100): 70% job, 30% ATS
        const overallFitScore = Math.round(
            jobMatchTotal * 0.7 +
            atsMatchTotal * 0.3
        );

        // Calculate Final Suggestion
        const finalSuggestion = computeFinalSuggestion(jobMatchTotal, atsMatchTotal, overallFitScore);

        return {
            job_matching_score: {
                dimensions: jobDim,  // Contains { score, pros, cons } for each dimension
                total: jobMatchTotal
            },
            ats_matching_score: {
                dimensions: atsDim,  // Contains { score, pros, cons } for each dimension
                total: atsMatchTotal
            },
            overall_fit_score: overallFitScore,
            final_suggestion: finalSuggestion
        };
    }

    function computeFinalSuggestion(jobMatchTotal, atsMatchTotal, overallFitScore) {
        // Base mapping by overall_fit_score - return translation keys
        let labelKey = '';
        let messageKey = '';

        if (overallFitScore >= 85) {
            labelKey = 'fs_label_85_100';
            messageKey = 'fs_expl_85_100';
        } else if (overallFitScore >= 70) {
            labelKey = 'fs_label_70_84';
            messageKey = 'fs_expl_70_84';
        } else if (overallFitScore >= 60) {
            labelKey = 'fs_label_50_69';
            messageKey = 'fs_expl_50_69';
        } else if (overallFitScore >= 40) {
            labelKey = 'fs_label_30_49';
            messageKey = 'fs_expl_30_49';
        } else {
            labelKey = 'fs_label_0_29';
            messageKey = 'fs_expl_0_29';
        }

        // Override message (not label) for special edge cases
        // Case A: Strong job fit, weak ATS
        if (jobMatchTotal >= 75 && atsMatchTotal < 55) {
            messageKey = 'fs_override_strong_job_weak_ats';
        }
        // Case B: Weak job fit, strong ATS
        else if (jobMatchTotal < 50 && atsMatchTotal >= 70) {
            messageKey = 'fs_override_weak_job_strong_ats';
        }

        return { labelKey, messageKey };
    }

    function displayResults(data) {
        resultsSection.classList.remove('hidden');
        const t = translations[currentLanguage] || translations['en'];

        // Header
        document.getElementById('res-job-title').textContent = state.jobTitle || t.headerJobTitleFallback;
        document.getElementById('res-resume-name').textContent = t.headerResumeFallback;

        // Cards - Update text and animate progress rings
        const jobScore = data.job_matching_score.total;
        const atsScore = data.ats_matching_score.total;
        const overallScore = data.overall_fit_score;

        document.getElementById('job-total-score').textContent = jobScore;
        document.getElementById('job-level-text').textContent = getLevelText(jobScore);
        animateProgressRing('job-progress-ring', jobScore, getScoreColor(jobScore));

        document.getElementById('ats-total-score').textContent = atsScore;
        document.getElementById('ats-level-text').textContent = getLevelText(atsScore);
        animateProgressRing('ats-progress-ring', atsScore, getScoreColor(atsScore));

        // Final Suggestion with dynamic styling (use pre-computed data)
        const suggestionSection = document.getElementById('final-suggestion-section');
        const fsIcon = document.getElementById('fs-icon');
        const finalSuggestion = data.final_suggestion;

        if (finalSuggestion) {
            suggestionSection.classList.remove('hidden', 'suggestion-excellent', 'suggestion-good', 'suggestion-fair', 'suggestion-poor');

            let suggestionClass, iconBg, icon;

            if (overallScore >= 85) {
                suggestionClass = 'suggestion-excellent';
                iconBg = 'bg-emerald-100';
                icon = '🎯';
            } else if (overallScore >= 70) {
                suggestionClass = 'suggestion-good';
                iconBg = 'bg-blue-100';
                icon = '✓';
            } else if (overallScore >= 60) {
                suggestionClass = 'suggestion-fair';
                iconBg = 'bg-amber-100';
                icon = '→';
            } else if (overallScore >= 40) {
                suggestionClass = 'suggestion-fair';
                iconBg = 'bg-orange-100';
                icon = '⚠';
            } else {
                suggestionClass = 'suggestion-poor';
                iconBg = 'bg-red-100';
                icon = '✗';
            }

            suggestionSection.classList.add(suggestionClass);
            fsIcon.className = `w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${iconBg}`;
            fsIcon.textContent = icon;

            document.getElementById('fs-label').textContent = t[finalSuggestion.labelKey] || finalSuggestion.labelKey;
            document.getElementById('fs-explanation').textContent = t[finalSuggestion.messageKey] || finalSuggestion.messageKey;
        } else {
            suggestionSection.classList.add('hidden');
        }

        // Job Details - Display dimensions with scores, pros, and cons
        const jobContainer = document.getElementById('job-fit-details-container');
        jobContainer.innerHTML = '';
        const jobDim = data.job_matching_score.dimensions;
        const jobDimLabels = {
            hard_skills: t.dim_hard_skills || 'Hard Skills',
            soft_skills: t.dim_soft_skills || 'Soft Skills',
            experience_alignment: t.dim_experience_alignment || 'Experience Alignment',
            education_certification: t.dim_education_certification || 'Education & Certification',
            semantic_similarity: t.dim_semantic_similarity || 'Semantic Similarity'
        };
        Object.keys(jobDim).forEach(key => {
            const label = jobDimLabels[key] || key;
            const dimData = jobDim[key]; // { score, pros, cons }
            jobContainer.appendChild(createDimensionRowWithProsCons(label, dimData.score, dimData.pros, dimData.cons, t));
        });

        // ATS Details - Display dimensions with scores, pros, and cons
        const atsContainer = document.getElementById('ats-opt-details-container');
        atsContainer.innerHTML = '';
        const atsDim = data.ats_matching_score.dimensions;
        const atsDimLabels = {
            keyword_alignment: t.dim_keyword_alignment || 'Keyword Alignment',
            formatting_structure: t.dim_formatting_structure || 'Formatting Structure',
            section_structure: t.dim_section_structure || 'Section Structure',
            language_compliance: t.dim_language_compliance || 'Language Compliance'
        };
        Object.keys(atsDim).forEach(key => {
            const label = atsDimLabels[key] || key;
            const dimData = atsDim[key]; // { score, pros, cons }
            atsContainer.appendChild(createDimensionRowWithProsCons(label, dimData.score, dimData.pros, dimData.cons, t));
        });
    }

    function createDimensionRowWithProsCons(label, score, pros, cons, t) {
        const div = document.createElement('div');
        div.className = 'bg-surface p-4 border-b border-black/5 last:border-0';

        // Score badge color based on score
        const badgeClass = score >= 4 ? 'bg-success/15 text-success' : score >= 3 ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger';

        // Build pros list
        const prosTitle = t.prosTitle || 'Pros';
        const consTitle = t.consTitle || 'Cons';
        const prosEmpty = t.prosEmptyFallback || 'No specific pros identified.';
        const consEmpty = t.consEmptyFallback || 'No specific cons identified.';

        const prosItems = (pros && pros.length > 0)
            ? pros.map(p => `<li class="flex gap-2"><span class="text-success mt-0.5 text-[10px]">●</span><span>${p}</span></li>`).join('')
            : `<li class="text-slate-400 italic">${prosEmpty}</li>`;

        const consItems = (cons && cons.length > 0)
            ? cons.map(c => `<li class="flex gap-2"><span class="text-danger mt-0.5 text-[10px]">●</span><span>${c}</span></li>`).join('')
            : `<li class="text-slate-400 italic">${consEmpty}</li>`;

        div.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <span class="font-semibold text-[15px] text-black">${label}</span>
                <span class="font-bold text-[13px] ${badgeClass} px-2.5 py-1 rounded-full">${score}/5</span>
            </div>
            <div class="mb-3">
                <strong class="text-success text-[11px] uppercase tracking-wide font-bold">${prosTitle}</strong>
                <ul class="list-none pl-0 text-[13px] text-slate-600 space-y-1 mt-1">${prosItems}</ul>
            </div>
            <div>
                <strong class="text-danger text-[11px] uppercase tracking-wide font-bold">${consTitle}</strong>
                <ul class="list-none pl-0 text-[13px] text-slate-600 space-y-1 mt-1">${consItems}</ul>
            </div>
        `;
        return div;
    }

    function getLevelText(score) {
        if (score >= 90) return "Excellent";
        if (score >= 80) return "Strong";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        return "Poor";
    }

    // Progress ring animation
    function animateProgressRing(elementId, score, color) {
        const circle = document.getElementById(elementId);
        if (!circle) return;

        // Circumference = 2 * PI * r = 2 * 3.14159 * 42 ≈ 264
        const circumference = 2 * Math.PI * 42;
        const offset = circumference - (score / 100) * circumference;

        circle.style.stroke = color;
        circle.setAttribute('stroke-dasharray', `${circumference} ${circumference}`);

        // Animate from 0 to target
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 50);
    }

    // Get color based on score
    function getScoreColor(score) {
        if (score >= 80) return '#34C759'; // Green
        if (score >= 60) return '#007AFF'; // Blue
        if (score >= 40) return '#FF9500'; // Orange
        return '#FF3B30'; // Red
    }
});
