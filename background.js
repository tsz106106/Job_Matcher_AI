// Basic background script
// Allows users to open the side panel by clicking the action icon

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Listen for tab updates to potentially inject generic scripts if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        // We can inject logic here if we decide to go with programmatic injection 
        // instead of manifest-based for generic sites.
        // For now, let's keep it simple.
    }
});
