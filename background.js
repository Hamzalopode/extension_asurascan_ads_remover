const extensions = 'https://developer.chrome.com/docs/extensions';
const webstore = 'https://developer.chrome.com/docs/webstore';

// Global state
let isEnabled = false;
let blockedCount = 0;

const TARGET_URL_PATTERN = "*://*.asuracomic.net/*"; // Used for matching tabs
const CSS_FILE = "focus-mode.css";

// Initialize state from storage or set defaults
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["isEnabled", "blockedCount"], (result) => {
    isEnabled = result.isEnabled === undefined ? false : result.isEnabled;
    blockedCount = result.blockedCount === undefined ? 0 : result.blockedCount;
    console.log("Extension initialized. Enabled:", isEnabled, "Blocked Count:", blockedCount);
    updateBadge();
    updateAllMatchingTabs(); // Apply to existing tabs on install/update
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "get_initial_state") {
    sendResponse({ isEnabled: isEnabled, blockedCount: blockedCount });
  } else if (request.command === "toggle_state") {
    isEnabled = !isEnabled;
    chrome.storage.local.set({ isEnabled: isEnabled }, () => {
      console.log("State toggled to:", isEnabled);
      updateBadge();
      updateAllMatchingTabs();
      sendResponse({ isEnabled: isEnabled, blockedCount: blockedCount });
      // Notify potentially open popups about the state change
      chrome.runtime.sendMessage({ command: 'state_updated', isEnabled: isEnabled, blockedCount: blockedCount }).catch(err => {/* console.log("Popup not open or error sending state update") */});
    });
    return true; // Indicates asynchronous response
  } else if (request.command === "increment_block_count") {
    blockedCount++;
    chrome.storage.local.set({ blockedCount: blockedCount }, () => {
        console.log("Block count incremented to:", blockedCount);
        // Notify popup if it's open
        chrome.runtime.sendMessage({ command: 'state_updated', isEnabled: isEnabled, blockedCount: blockedCount }).catch(err => {/* console.log("Popup not open or error sending count update") */});
    });
    // sendResponse can be added if content script needs confirmation
  }
  return false; // Default for synchronous messages or if not handled by these conditions
});

function updateBadge() {
  const badgeText = isEnabled ? "ON" : "OFF";
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: isEnabled ? '#4CAF50' : '#F44336' });
  console.log("Badge updated to:", badgeText);
}

async function applyStyles(tabId) {
  try {
    await chrome.scripting.insertCSS({
      files: [CSS_FILE],
      target: { tabId: tabId },
    });
    console.log(`CSS injected into tab ${tabId}`);
  } catch (err) {
    // Errors are expected if the tab URL doesn't match host permissions or tab is non-existent
    // console.error(`Failed to inject CSS into tab ${tabId}: ${err.message}`);
  }
}

async function removeStyles(tabId) {
  try {
    await chrome.scripting.removeCSS({
      files: [CSS_FILE],
      target: { tabId: tabId },
    });
    console.log(`CSS removed from tab ${tabId}`);
  } catch (err) {
    // Errors are expected here too for same reasons as insertCSS
    // console.error(`Failed to remove CSS from tab ${tabId}: ${err.message}`);
  }
}

// Function to update a single tab based on current state.
// Relies on host_permissions in manifest.json for actual access control.
function updateTab(tabId) {
  if (isEnabled) {
    applyStyles(tabId);
    // Later: inject content script for blocking and counting
  } else {
    removeStyles(tabId);
    // Later: ensure content script effects are removed
  }
}

// Update all matching tabs when state changes or on startup
function updateAllMatchingTabs() {
  chrome.tabs.query({ url: TARGET_URL_PATTERN }, (tabs) => {
    if (chrome.runtime.lastError) {
        // console.error("Error querying tabs:", chrome.runtime.lastError.message);
        return;
    }
    for (const tab of tabs) {
      if (tab.id) updateTab(tab.id);
    }
  });
}

// Listen for tab updates (e.g., navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Ensure tab.url is present and changeInfo indicates loading is complete enough
  // to avoid errors trying to inject into about:blank or during initial load phases.
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    // Check if this tab URL matches our target pattern before updating
    // This check is somewhat redundant if updateTab itself relies on manifest permissions
    // but can prevent unnecessary calls to scripting API for non-relevant tabs.
    if (tab.url.includes(TARGET_URL_PATTERN.replace("*://*.", "").replace("/*", ""))) {
        updateTab(tabId);
    }
  }
});

// Initial load of state and badge update when service worker starts
chrome.storage.local.get(["isEnabled", "blockedCount"], (result) => {
    isEnabled = result.isEnabled === undefined ? false : result.isEnabled;
    blockedCount = result.blockedCount === undefined ? 0 : result.blockedCount;
    updateBadge();
    // updateAllMatchingTabs(); // Optionally re-apply to all tabs on SW wake, onInstalled handles initial
});