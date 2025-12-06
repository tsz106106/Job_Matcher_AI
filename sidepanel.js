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
            navItems.forEach(n => n.classList.remove('active'));
            nav.classList.add('active');

            // Update View State
            const viewId = nav.dataset.view;
            viewSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `view-${viewId}`) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
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
        const langInstruction = currentLanguage === 'zh-TW'
            ? "Respond in Traditional Chinese (繁體中文) where applicable (evidence lists, etc)."
            : "Respond in English.";

        const prompt = `
            You are an expert HR Recruiter and ATS specialist.
            ${langInstruction}
            
            Analyze the match using the following fixed JSON structure.
            Input Data:
            RESUME: ${resume.substring(0, 3000)} ...
            JOB DESC: ${jobDesc.substring(0, 3000)} ...
            INFO: ${info}

            SCORING RULES (0-5 scale per dimension):
            0=None, 1=Weak, 2=Partial, 3=Moderate, 4=Strong, 5=Perfect.

            STRICT JSON OUTPUT FORMAT:
            {
              "job_matching_score": {
                "dimensions": [
                  { "id": "core_hard_skills", "score_0_to_5": 0, "evidence_from_resume": ["str"], "missing_or_weak_points": ["str"] },
                  { "id": "responsibilities_experience", "score_0_to_5": 0, "evidence_from_resume": [], "missing_or_weak_points": [] },
                  { "id": "industry_domain", "score_0_to_5": 0, "evidence_from_resume": [], "missing_or_weak_points": [] },
                  { "id": "seniority_level", "score_0_to_5": 0, "evidence_from_resume": [], "missing_or_weak_points": [] },
                  { "id": "education_certifications", "score_0_to_5": 0, "evidence_from_resume": [], "missing_or_weak_points": [] },
                  { "id": "location_eligibility", "score_0_to_5": 0, "evidence_from_resume": [], "missing_or_weak_points": [] },
                  { "id": "soft_skills_culture", "score_0_to_5": 0, "evidence_from_resume": [], "missing_or_weak_points": [] }
                ],
                "top_matched_requirements": ["str"],
                "top_missing_requirements": ["str"]
              },
              "ats_matching_score": {
                "dimensions": [
                  { "id": "keyword_coverage", "score_0_to_5": 0, "strengths": ["str"], "issues": ["str"] },
                  { "id": "section_structure", "score_0_to_5": 0, "strengths": [], "issues": [] },
                  { "id": "formatting_parsing", "score_0_to_5": 0, "strengths": [], "issues": [] },
                  { "id": "clarity_metrics", "score_0_to_5": 0, "strengths": [], "issues": [] },
                  { "id": "tailoring", "score_0_to_5": 0, "strengths": [], "issues": [] },
                  { "id": "noise_irrelevance", "score_0_to_5": 0, "strengths": [], "issues": [] },
                  { "id": "contact_info", "score_0_to_5": 0, "strengths": [], "issues": [] }
                ],
                "ats_risks": ["str"],
                "improvement_suggestions": ["str"]
              }
            }
            RETURN JSON ONLY.
        `;

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

        // Simple JSON cleanup (find boundaries)
        const startIndex = textToParse.indexOf('{');
        const endIndex = textToParse.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            textToParse = textToParse.substring(startIndex, endIndex + 1);
        }

        try {
            const parsed = JSON.parse(textToParse);
            return calculateFinalScores(parsed);
        } catch (e) {
            console.error("JSON Parse Error", textToParse);
            throw new Error("Failed to parse analysis results.");
        }
    }

    function calculateFinalScores(data) {
        // Job Match Weights
        const jobWeights = {
            core_hard_skills: 35,
            responsibilities_experience: 25,
            industry_domain: 10,
            seniority_level: 10,
            education_certifications: 10,
            location_eligibility: 5,
            soft_skills_culture: 5
        };

        let jobTotal = 0;
        data.job_matching_score.dimensions.forEach(dim => {
            const weight = jobWeights[dim.id] || 0;
            jobTotal += (dim.score_0_to_5 / 5) * weight;
        });
        data.job_matching_score.total = Math.round(jobTotal);

        // ATS Match Weights
        const atsWeights = {
            keyword_coverage: 35,
            section_structure: 15,
            formatting_parsing: 15,
            clarity_metrics: 10,
            tailoring: 10,
            noise_irrelevance: 10,
            contact_info: 5
        };

        let atsTotal = 0;
        data.ats_matching_score.dimensions.forEach(dim => {
            const weight = atsWeights[dim.id] || 0;
            atsTotal += (dim.score_0_to_5 / 5) * weight;
        });
        data.ats_matching_score.total = Math.round(atsTotal);

        return data;
    }

    function displayResults(data) {
        resultsSection.classList.remove('hidden');
        const t = translations[currentLanguage] || translations['en'];

        // Header
        document.getElementById('res-job-title').textContent = state.jobTitle || t.headerJobTitleFallback;
        document.getElementById('res-resume-name').textContent = t.headerResumeFallback; // We don't have resume name stored yet

        // Cards
        document.getElementById('job-total-score').textContent = data.job_matching_score.total;
        document.getElementById('job-level-text').textContent = getLevelText(data.job_matching_score.total);

        document.getElementById('ats-total-score').textContent = data.ats_matching_score.total;
        document.getElementById('ats-level-text').textContent = getLevelText(data.ats_matching_score.total);

        // Job Details
        const jobContainer = document.getElementById('job-fit-details-container');
        jobContainer.innerHTML = '';
        data.job_matching_score.dimensions.forEach(dim => {
            const label = t[`dim_${dim.id}`] || dim.id;
            jobContainer.appendChild(createDimensionRow(label, dim.score_0_to_5, dim.evidence_from_resume, dim.missing_or_weak_points, t));
        });

        renderList('job-top-matched', data.job_matching_score.top_matched_requirements);
        renderList('job-top-missing', data.job_matching_score.top_missing_requirements);

        // ATS Details
        const atsContainer = document.getElementById('ats-opt-details-container');
        atsContainer.innerHTML = '';
        data.ats_matching_score.dimensions.forEach(dim => {
            const label = t[`dim_${dim.id}`] || dim.id;
            atsContainer.appendChild(createDimensionRow(label, dim.score_0_to_5, dim.strengths, dim.issues, t));
        });

        renderList('ats-risks', data.ats_matching_score.ats_risks);
        renderList('ats-improvements', data.ats_matching_score.improvement_suggestions);
    }

    function createDimensionRow(label, score, positives, negatives, t) {
        const div = document.createElement('div');
        div.className = 'dimension-row';
        div.innerHTML = `
            <div class="dim-header">
                <span class="dim-name">${label}</span>
                <span class="dim-score">${score}/5</span>
            </div>
            ${positives && positives.length ? `<div class="dim-evidence"><strong>${t.lblStrengths || t.lblEvidence}:</strong><ul>${positives.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
            ${negatives && negatives.length ? `<div class="dim-issues"><strong>${t.lblIssues || t.lblMissingWeak}:</strong><ul>${negatives.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
        `;
        return div;
    }

    function renderList(id, items) {
        const el = document.getElementById(id);
        if (el && items) {
            el.innerHTML = items.map(i => `<li>${i}</li>`).join('');
        }
    }

    function getLevelText(score) {
        if (score >= 90) return "Excellent";
        if (score >= 80) return "Strong";
        if (score >= 60) return "Good";
        if (score >= 40) return "Fair";
        return "Poor";
    }

    function updateCircle(prefix, score) {
        const textToUpdate = document.getElementById(`${prefix}-score-text`);
        const pathToUpdate = document.getElementById(`${prefix}-score-path`);
        const chartToUpdate = document.getElementById(`${prefix}-chart`);

        textToUpdate.textContent = `${score}%`;

        // Update circle color
        chartToUpdate.classList.remove('score-high', 'score-medium', 'score-low'); // actually parent usually had class but now SVG has wrapper or checking hierarchy
        // The original code used a class on the wrapper or svg. Let's look at CSS.
        // .score-high .circle { stroke: ... }
        // The SVG parent is .score-circle. But we have unique IDs for SVGs now.
        // Let's add the class to the .score-circle container which is the parent of SVG
        chartToUpdate.parentElement.classList.remove('score-high', 'score-medium', 'score-low');

        if (score >= 80) chartToUpdate.parentElement.classList.add('score-high');
        else if (score >= 50) chartToUpdate.parentElement.classList.add('score-medium');
        else chartToUpdate.parentElement.classList.add('score-low');

        // Path Dash Array
        pathToUpdate.setAttribute('stroke-dasharray', `${score}, 100`);
    }
});
