document.addEventListener('DOMContentLoaded', () => {
    const unlinkView  = document.getElementById('unlinkView');
    const linkedView  = document.getElementById('linkedView');
    const emailInput  = document.getElementById('emailInput');
    const linkBtn     = document.getElementById('linkBtn');
    const unlinkBtn   = document.getElementById('unlinkBtn');
    const linkedEmail = document.getElementById('linkedEmail');

    function showLinked(email) {
        unlinkView.style.display  = 'none';
        linkedView.style.display  = 'block';
        linkedEmail.textContent   = email;
    }

    function showUnlinked() {
        unlinkView.style.display  = 'block';
        linkedView.style.display  = 'none';
        emailInput.value          = '';
    }

    // ── Initial State ─────────────────────────────────────────────────────────
    chrome.storage.local.get(['website_email'], (result) => {
        if (result.website_email) {
            showLinked(result.website_email);
        } else {
            showUnlinked();
        }
    });

    // ── Link Account ──────────────────────────────────────────────────────────
    linkBtn.addEventListener('click', () => {
        const email = emailInput.value.trim().toLowerCase();
        if (!email || !email.includes('@')) {
            emailInput.style.borderColor = '#ef4444';
            emailInput.placeholder = 'Please enter a valid email!';
            setTimeout(() => { emailInput.style.borderColor = ''; }, 2000);
            return;
        }

        chrome.runtime.sendMessage({ action: 'link_email', email }, (response) => {
            if (response && response.success) {
                showLinked(email);
            }
        });
    });

    // ── Allow pressing Enter to link ──────────────────────────────────────────
    emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') linkBtn.click();
    });

    // ── Unlink Account ────────────────────────────────────────────────────────
    unlinkBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'unlink' }, (response) => {
            if (response && response.success) {
                showUnlinked();
            }
        });
    });

    // ── React to storage changes (e.g. from background) ───────────────────────
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.website_email) {
            if (changes.website_email.newValue) {
                showLinked(changes.website_email.newValue);
            } else {
                showUnlinked();
            }
        }
    });
});
