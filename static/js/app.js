// Global State
let allUpdates = [];
let filteredUpdates = [];
let currentCategory = 'ALL';
let currentSort = 'newest';
let searchQuery = '';
let activeTweetUpdate = null;

// Progress ring setup for character counter
const CIRCUMFERENCE = 2 * Math.PI * 10; // r=10

// Elements
const feedContainer = document.getElementById('feed-container');
const btnRefresh = document.getElementById('btn-refresh');
const btnExportCsv = document.getElementById('btn-export-csv');
const refreshIcon = document.getElementById('refresh-icon');
const lastUpdatedText = document.getElementById('last-updated');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const categoryPills = document.getElementById('category-pills');
const sortOrder = document.getElementById('sort-order');
const resultsCount = document.getElementById('results-count');
const activeFiltersIndicator = document.getElementById('active-filters-indicator');

// Dashboard Stats Elements
const statsTotal = document.getElementById('stats-total');
const statsFeatures = document.getElementById('stats-features');
const statsAnnouncements = document.getElementById('stats-announcements');
const statsIssues = document.getElementById('stats-issues');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelTweet = document.getElementById('btn-cancel-tweet');
const btnPublishTweet = document.getElementById('btn-publish-tweet');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const charProgressCircle = document.getElementById('char-progress-circle');
const attachmentType = document.getElementById('attachment-type');
const attachmentDate = document.getElementById('attachment-date');
const attachmentText = document.getElementById('attachment-text');

// Toast Elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize Progress Ring
if (charProgressCircle) {
    charProgressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    charProgressCircle.style.strokeDashoffset = CIRCUMFERENCE;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Theme Switcher Logic
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    document.body.className = savedTheme;
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (document.body.classList.contains('dark-theme')) {
                document.body.classList.remove('dark-theme');
                document.body.classList.add('light-theme');
                localStorage.setItem('theme', 'light-theme');
            } else {
                document.body.classList.remove('light-theme');
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark-theme');
            }
        });
    }

    fetchReleaseNotes(false);
    
    // Refresh listener
    btnRefresh.addEventListener('click', () => fetchReleaseNotes(true));
    
    // Export CSV listener
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', exportToCSV);
    }
    
    // Search listener
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().strip();
        if (searchQuery) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        applyFilters();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        applyFilters();
    });
    
    // Category pills listener
    categoryPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        // Remove active class from all pills
        categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        // Add to active
        pill.classList.add('active');
        
        currentCategory = pill.dataset.category;
        applyFilters();
    });
    
    // Sort dropdown
    sortOrder.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFilters();
    });
    
    // Close Modal Events
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelTweet.addEventListener('click', closeModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeModal();
    });
    
    // Textarea input event for char counter
    tweetTextarea.addEventListener('input', updateCharCount);
    
    // Publish tweet
    btnPublishTweet.addEventListener('click', publishTweet);
    
    // Esc key modal close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !tweetModal.classList.contains('hidden')) {
            closeModal();
        }
    });
});

// String strip helper
String.prototype.strip = function() {
    return this.trim();
};

// Fetch release notes
async function fetchReleaseNotes(forceRefresh = false) {
    setLoadingState(true);
    
    const url = `/api/release-notes${forceRefresh ? '?refresh=true' : ''}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'success') {
            allUpdates = data.updates;
            
            // Format current timestamp
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            lastUpdatedText.textContent = `Last Synced: ${timeString}`;
            
            // Update Dashboard Counters
            updateDashboardStats();
            
            showToast(forceRefresh ? "Synced live release feed!" : "BigQuery release notes loaded.");
            applyFilters();
        } else {
            console.error("Error payload returned:", data);
            showToast("Failed to fetch release notes: " + (data.message || "Unknown error"), true);
            renderEmptyState("Error loading release notes feed.");
            resetDashboardStats();
        }
    } catch (err) {
        console.error("HTTP Fetch Error:", err);
        showToast("Network error while connecting to backend", true);
        renderEmptyState("Unable to reach backend. Please ensure the Flask server is running.");
        resetDashboardStats();
    } finally {
        setLoadingState(false);
    }
}

// Show/Hide Loading Spinner and Skeletons
function setLoadingState(isLoading) {
    if (isLoading) {
        btnRefresh.disabled = true;
        refreshIcon.classList.add('spinning');
        
        // Show skeletons
        feedContainer.innerHTML = `
            <div class="skeleton-card card">
                <div class="skeleton-header"><div class="skeleton-pill"></div><div class="skeleton-date"></div></div>
                <div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
                <div class="skeleton-footer"></div>
            </div>
            <div class="skeleton-card card">
                <div class="skeleton-header"><div class="skeleton-pill"></div><div class="skeleton-date"></div></div>
                <div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
                <div class="skeleton-footer"></div>
            </div>
            <div class="skeleton-card card">
                <div class="skeleton-header"><div class="skeleton-pill"></div><div class="skeleton-date"></div></div>
                <div class="skeleton-body"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
                <div class="skeleton-footer"></div>
            </div>
        `;
    } else {
        btnRefresh.disabled = false;
        refreshIcon.classList.remove('spinning');
    }
}

// Update Dashboard Stats Widget Counters
function updateDashboardStats() {
    if (!allUpdates) return;
    
    const total = allUpdates.length;
    const features = allUpdates.filter(u => u.type === 'Feature').length;
    const announcements = allUpdates.filter(u => u.type === 'Announcement').length;
    const issues = allUpdates.filter(u => u.type === 'Issue' || u.type === 'Bug Fix').length;
    
    statsTotal.textContent = total;
    statsFeatures.textContent = features;
    statsAnnouncements.textContent = announcements;
    statsIssues.textContent = issues;
}

// Reset stats in case of fetch failures
function resetDashboardStats() {
    statsTotal.textContent = '-';
    statsFeatures.textContent = '-';
    statsAnnouncements.textContent = '-';
    statsIssues.textContent = '-';
}

// Apply Search, Sort, and Categories
function applyFilters() {
    filteredUpdates = allUpdates.filter(update => {
        // Category Filter
        let categoryMatch = false;
        if (currentCategory === 'ALL') {
            categoryMatch = true;
        } else if (currentCategory === 'Issue') {
            categoryMatch = (update.type === 'Issue' || update.type === 'Bug Fix');
        } else {
            categoryMatch = (update.type === currentCategory);
        }
        
        // Search Filter
        const textContent = update.text_content.toLowerCase();
        const dateText = update.date.toLowerCase();
        const typeText = update.type.toLowerCase();
        const searchMatch = !searchQuery || 
                            textContent.includes(searchQuery) || 
                            dateText.includes(searchQuery) ||
                            typeText.includes(searchQuery);
                            
        return categoryMatch && searchMatch;
    });
    
    // Sort
    filteredUpdates.sort((a, b) => {
        const dateA = new Date(a.updated || a.date);
        const dateB = new Date(b.updated || b.date);
        return currentSort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    // Update Indicators
    resultsCount.textContent = `Showing ${filteredUpdates.length} update${filteredUpdates.length === 1 ? '' : 's'}`;
    
    if (searchQuery || currentCategory !== 'ALL') {
        activeFiltersIndicator.classList.remove('hidden');
    } else {
        activeFiltersIndicator.classList.add('hidden');
    }
    
    renderFeed();
}

// Render the grid of cards
function renderFeed() {
    if (filteredUpdates.length === 0) {
        renderEmptyState("No release notes match your active filters or search query.");
        return;
    }
    
    feedContainer.innerHTML = '';
    filteredUpdates.forEach(update => {
        const card = document.createElement('div');
        const normalizedType = update.type.toLowerCase().replace(' ', '-');
        card.className = `card type-${normalizedType}`;
        
        card.innerHTML = `
            <div class="card-header">
                <span class="badge badge-${normalizedType}">${update.type}</span>
                <span class="card-date">
                    ${update.date}
                    <a href="${update.link}" target="_blank" class="link-icon" title="View official release notes">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>
                        </svg>
                    </a>
                </span>
            </div>
            <div class="card-body">
                ${update.html_content}
            </div>
            <div class="card-footer">
                <div class="footer-buttons">
                    <button class="btn-copy" onclick="copyUpdateToClipboard('${update.id}')" title="Copy update text to clipboard">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span>Copy</span>
                    </button>
                    <button class="btn-tweet" onclick="openTweetModal('${update.id}')">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>Tweet update</span>
                    </button>
                </div>
            </div>
        `;
        feedContainer.appendChild(card);
    });
}

// Render empty state template
function renderEmptyState(message) {
    feedContainer.innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17h6M9 8h6M9 12h6"/>
            </svg>
            <h3>No Updates Found</h3>
            <p>${message}</p>
        </div>
    `;
}

// Open Tweet Modal
window.openTweetModal = function(id) {
    const update = allUpdates.find(u => u.id === id);
    if (!update) return;
    
    activeTweetUpdate = update;
    
    // Set attachments details
    attachmentType.textContent = update.type;
    attachmentType.className = `attachment-type badge-${update.type.toLowerCase().replace(' ', '-')}`;
    attachmentDate.textContent = update.date;
    attachmentText.textContent = update.text_content;
    
    // Build initial smart draft tweet
    const draftText = generateTweetText(update);
    tweetTextarea.value = draftText;
    
    // Open Modal visually
    tweetModal.classList.remove('hidden');
    updateCharCount();
    
    // Set focus on text box
    setTimeout(() => {
        tweetTextarea.focus();
        tweetTextarea.setSelectionRange(0, 0); // Put cursor at start
    }, 100);
};

// Generate an engaging tweet within the limit
function generateTweetText(update) {
    const hashtag = "#BigQuery";
    const link = update.link;
    
    // Space remaining for update summary text
    // 280 - (spaces + headers + link length + hashtag length)
    const prefix = `Google #BigQuery ${update.type} (${update.date}): `;
    const suffix = ` ${link}`;
    
    const availableLength = 280 - prefix.length - suffix.length;
    
    let updateText = update.text_content;
    if (updateText.length > availableLength) {
        // Truncate nicely on word boundary
        updateText = updateText.substring(0, availableLength - 4);
        const lastSpace = updateText.lastIndexOf(' ');
        if (lastSpace > 0) {
            updateText = updateText.substring(0, lastSpace);
        }
        updateText += '...';
    }
    
    return `${prefix}"${updateText}"${suffix}`;
}

// Update character counter and SVG indicator
function updateCharCount() {
    const length = tweetTextarea.value.length;
    const remaining = 280 - length;
    
    charCounter.textContent = remaining;
    
    // Toggle warning styles
    if (remaining < 0) {
        charCounter.style.color = 'var(--danger)';
        charProgressCircle.style.stroke = 'var(--danger)';
        btnPublishTweet.disabled = true;
        btnPublishTweet.style.opacity = 0.5;
    } else if (remaining <= 20) {
        charCounter.style.color = 'var(--warning)';
        charProgressCircle.style.stroke = 'var(--warning)';
        btnPublishTweet.disabled = false;
        btnPublishTweet.style.opacity = 1;
    } else {
        charCounter.style.color = 'var(--text-secondary)';
        charProgressCircle.style.stroke = 'var(--primary)';
        btnPublishTweet.disabled = false;
        btnPublishTweet.style.opacity = 1;
    }
    
    // Progress Ring offset
    const percentage = Math.min(length / 280, 1);
    const offset = CIRCUMFERENCE - percentage * CIRCUMFERENCE;
    charProgressCircle.style.strokeDashoffset = offset;
}

// Close Modal
function closeModal() {
    tweetModal.classList.add('hidden');
    activeTweetUpdate = null;
}

// Launch Twitter intent share
function publishTweet() {
    if (!tweetTextarea.value || tweetTextarea.value.length > 280) {
        showToast("Invalid tweet length", true);
        return;
    }
    
    const tweetText = tweetTextarea.value;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    // Open in a new tab
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    
    closeModal();
    showToast("Opened tweet draft on X/Twitter!");
}

// Custom Toast Notification
let toastTimeout;
function showToast(message, isError = false) {
    clearTimeout(toastTimeout);
    
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    
    const glow = toast.querySelector('.toast-glow');
    
    if (isError) {
        toast.style.borderColor = '#fca5a5';       // Pastel red border
        toast.style.backgroundColor = '#fef2f2';   // Light red background
        toastMessage.style.color = '#991b1b';      // Dark red text
        if (glow) glow.style.background = 'var(--danger)';
    } else {
        toast.style.borderColor = '#a7f3d0';       // Pastel green border
        toast.style.backgroundColor = '#ecfdf5';   // Light green background
        toastMessage.style.color = '#065f46';      // Dark green text
        if (glow) glow.style.background = 'var(--success)';
    }
    
    toast.classList.add('show');
    toast.classList.remove('hidden');
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 4000);
}

// Utility features

// Copy release note plaintext to clipboard
window.copyUpdateToClipboard = async function(id) {
    const update = allUpdates.find(u => u.id === id);
    if (!update) return;
    
    try {
        const shareText = `${update.type} Update (${update.date}):\n${update.text_content}\n\nRead more: ${update.link}`;
        await navigator.clipboard.writeText(shareText);
        showToast("Copied update to clipboard!");
    } catch (err) {
        console.error("Clipboard copy failed:", err);
        showToast("Failed to copy to clipboard", true);
    }
};

// Export currently filtered updates to CSV
function exportToCSV() {
    if (filteredUpdates.length === 0) {
        showToast("No updates to export", true);
        return;
    }
    
    let csvHeaders = "Date,Category,Link,Update Text\n";
    let csvRows = filteredUpdates.map(u => {
        const date = `"${u.date.replace(/"/g, '""')}"`;
        const type = `"${u.type.replace(/"/g, '""')}"`;
        const link = `"${u.link.replace(/"/g, '""')}"`;
        const text = `"${u.text_content.replace(/"/g, '""')}"`;
        return `${date},${type},${link},${text}`;
    }).join("\n");
    
    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV downloaded successfully!");
}
