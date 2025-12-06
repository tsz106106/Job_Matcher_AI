// LinkedIn Content Script

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getJobDetails") {
        extractJobDetails().then(sendResponse);
        return true; // Keep channel open for async response
    }
});

async function extractJobDetails() {
    // Attempt to find job details on the page
    // LinkedIn structure changes often, so we need robust selectors or multiple attempts

    // Selectors as of late 2024/2025 (Predicted)
    // Detailed view (job searching) vs Direct job page

    let title = '';
    let company = '';
    let description = '';

    // 1. Job Collections / Search View (e.g. /jobs/collections/...)
    // The right pane usually contains the details
    const rightPane = document.querySelector('.jobs-search__job-details--container') ||
        document.querySelector('.jobs-details__main-content');

    if (rightPane) {
        title = rightPane.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText ||
            rightPane.querySelector('h2')?.innerText;
        company = rightPane.querySelector('.job-details-jobs-unified-top-card__company-name')?.innerText ||
            rightPane.querySelector('.jobs-unified-top-card__company-name')?.innerText;
        description = rightPane.querySelector('#job-details')?.innerText ||
            rightPane.querySelector('.jobs-description-content__text')?.innerText;
    } else {
        // 2. Direct Job Page (e.g. /jobs/view/...)
        title = document.querySelector('.top-card-layout__title')?.innerText ||
            document.querySelector('h1')?.innerText;
        company = document.querySelector('.top-card-layout__first-subline .topcard__org-name-link')?.innerText ||
            document.querySelector('.top-card-layout__company-info')?.innerText;
        description = document.querySelector('.description__text')?.innerText ||
            document.querySelector('.core-section-container__content')?.innerText;
    }

    // Cleanup
    if (description && description.includes("Show more")) {
        // Sometimes "Show more" button hides text, but usually innerText grabs hidden text if just visually hidden
        // But if it's not in DOM, we might need to click 'See more'.
        // For now, assume it's there or user has expanded it.
        const expandBtn = document.querySelector('.jobs-description__footer-button') ||
            document.querySelector('.see-more-less-list__button');
        if (expandBtn) expandBtn.click(); // aggressively try to expand

        // slight delay might be needed, but for now just return what we have
    }

    if (!title && !description) {
        // Log for debugging
        console.log("Job Matcher: Could not find job details with standard selectors.");

        // Final fallback: metadata
        // Sometimes LinkedIn puts job info in meta tags
        // But let's try to just grab the main h1 and the biggest text block
        if (!title) title = document.title;
        if (!description) {
            // grab the largest text container in main
            const main = document.querySelector('main');
            if (main) description = main.innerText.substring(0, 5000);
        }
    }

    console.log("Job Matcher extracted:", { title, company, descriptionLength: description ? description.length : 0 });

    return {
        jobTitle: title?.trim(),
        jobCompany: company?.trim(),
        jobDescription: description?.trim()
    };
}
