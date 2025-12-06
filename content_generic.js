// Generic Content Script for other Job Sites

// Avoid conflict with specific scripts
if (window.location.hostname.includes('linkedin.com') || window.location.hostname.includes('reed.co.uk')) {
    // Do nothing, let specific scripts handle it
} else {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getJobDetails") {
            const details = extractGenericDetails();
            sendResponse(details);
        }
    });
}

function extractGenericDetails() {
    // Best effort extraction
    // Look for common job schema.org data
    let title = '';
    let company = '';
    let description = '';

    // 1. Try structured data (JSON-LD)
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
        try {
            const data = JSON.parse(script.innerText);
            if (data['@type'] === 'JobPosting') {
                title = data.title;
                company = data.hiringOrganization?.name;
                description = data.description; // Often HTML

                // Convert HTML desc to text if needed
                if (description) {
                    const temp = document.createElement('div');
                    temp.innerHTML = description;
                    description = temp.innerText;
                }
                break;
            }
        } catch (e) {
            // ignore parse errors
        }
    }

    // 2. Heuristics if no structured data
    if (!description) {
        // Try to find the biggest block of text, or elements with 'job' and 'description' in class/id
        const potentialDesc = document.querySelector('[class*="job"][class*="description"]') ||
            document.querySelector('main') ||
            document.querySelector('article');

        if (potentialDesc) {
            description = potentialDesc.innerText;
        } else {
            // Fallback: mostly body text, removing nav/footer?
            // Too risky to send whole body, might be too long. 
            // Let's return selection if user selected text?
            const selection = window.getSelection().toString();
            if (selection.length > 50) {
                description = selection;
                title = "Selected Text Job";
            }
        }
    }

    if (!title && document.title) {
        title = document.title;
    }

    if (!title && !description) {
        console.log("Job Matcher (Generic): No details found.");
        return null; // Don't return partial garbage for generic
    }

    console.log("Job Matcher extracted (Generic):", { title, descriptionLength: description ? description.length : 0 });

    return {
        jobTitle: title?.trim() || "Unknown Job Title",
        jobCompany: company?.trim() || "Unknown Company",
        jobDescription: description?.trim().substring(0, 10000) // Limit length
    };
}
