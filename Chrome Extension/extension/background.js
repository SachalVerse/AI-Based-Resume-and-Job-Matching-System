// background.js — service worker (no OAuth needed now; just storage helper)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'link_email') {
        const { email } = request;
        chrome.storage.local.set({ website_email: email }, () => {
            console.log('[CareerTrack] Website email linked:', email);
            sendResponse({ success: true });
        });
        return true; // Keep channel open for async response
    }

    if (request.action === 'unlink') {
        chrome.storage.local.remove(['website_email'], () => {
            sendResponse({ success: true });
        });
        return true;
    }
});
