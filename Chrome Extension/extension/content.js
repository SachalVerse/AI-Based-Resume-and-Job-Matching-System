// ──────────────────────────────────────────────────────────────────────────────
// CareerTrack LinkedIn Sync — content.js
// Runs on every LinkedIn page. Scrapes posts and sends them to the
// FastAPI backend at localhost:8000, tied to the user's website email.
// ──────────────────────────────────────────────────────────────────────────────

const BACKEND_URL = 'http://localhost:8000/linkedin/save-posts';

// ── DOM Selectors (most-specific first, fallbacks after) ──────────────────────
function extractPosts() {
    const selectors = [
        '.feed-shared-update-v2__description .update-components-text',
        '.update-components-text',
        '.feed-shared-update-v2__description',
        '.feed-shared-text span[dir="ltr"]',
        '.break-words span[dir="ltr"]',
    ];

    let postElements = [];
    for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) { postElements = Array.from(els); break; }
    }

    const seen = new Set();
    const posts = [];
    postElements.forEach((el) => {
        const text = (el.innerText || el.textContent || '').trim();
        if (text.length > 20 && !seen.has(text)) {
            seen.add(text);
            posts.push({ text });
        }
    });
    return posts;
}

// ── State ─────────────────────────────────────────────────────────────────────
let previousCount = 0;
let isSending = false;

async function attemptSync() {
    if (isSending) return;

    // Only proceed if the user has linked their website email
    const { website_email } = await chrome.storage.local.get(['website_email']);
    if (!website_email) {
        console.log('[CareerTrack] No website email linked. Open the extension popup to link your account.');
        return;
    }

    const posts = extractPosts();
    if (posts.length <= previousCount) return;   // Nothing new

    isSending = true;
    previousCount = posts.length;

    try {
        const res = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_email: website_email,
                posts: posts,
                source: 'chrome_extension',
                url: window.location.href
            })
        });
        const data = await res.json();
        console.log(`[CareerTrack] Synced ${data.saved} new post(s) — ${data.skipped} duplicate(s) skipped.`);
    } catch (e) {
        console.error('[CareerTrack] Failed to send posts to backend:', e);
    } finally {
        isSending = false;
    }
}

// ── Debounce helper ───────────────────────────────────────────────────────────
function debounce(fn, wait) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

const debouncedSync = debounce(attemptSync, 2000);

// ── Check for explicit fetch intent ───────────────────────────────────────────
function shouldScrape() {
    // Only scrape if explicitly requested via our custom URL parameter
    return window.location.href.includes('careertrack_fetch=true');
}

// ── Scroll listener ───────────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
    if (shouldScrape()) {
        debouncedSync();
    }
}, true);

// ── SPA URL-change detection ──────────────────────────────────────────────────
let lastUrl = location.href;
new MutationObserver(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        previousCount = 0;
        if (shouldScrape()) {
            setTimeout(attemptSync, 3500);
        }
    }
}).observe(document, { subtree: true, childList: true });

// ── Initial scrape on page load ───────────────────────────────────────────────
if (shouldScrape()) {
    setTimeout(attemptSync, 3500);
}
