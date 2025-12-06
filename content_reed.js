// Reed.co.uk Content Script

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getJobDetails") {
        extractJobDetails().then(sendResponse);
        return true;
    }
});

async function extractJobDetails() {
    let title = '';
    let company = '';
    let description = '';

    // Reed Job Page
    const header = document.querySelector('header.job-header');
    if (header) {
        title = header.querySelector('h1')?.innerText;
        company = header.querySelector('span[itemprop="name"]')?.innerText ||
            header.querySelector('.posted-by a')?.innerText;
    }

    const descContainer = document.querySelector('.description-container') ||
        document.querySelector('div[itemprop="description"]');

    if (descContainer) {
        description = descContainer.innerText;
    }

    if (!title && !description) {
        console.log("Job Matcher: Could not find Reed job details. enhanced fallback...");
        if (!title) title = document.title;
        if (!description) {
            const main = document.querySelector('main') || document.body;
            description = main.innerText.substring(0, 5000);
        }
    }

    console.log("Job Matcher extracted (Reed):", { title, descriptionLength: description ? description.length : 0 });

    return {
        jobTitle: title?.trim(),
        jobCompany: company?.trim(),
        jobDescription: description?.trim()
    };
}
