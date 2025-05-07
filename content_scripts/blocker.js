let isExtensionEnabled = false;
let observer = null;

const POPUP_SELECTOR = 'div.relative[class*="from-[#231258]"][class*="to-[#1b0e45]"][class*="rounded-xl"][class*="p-6"]';
const SKIP_AD_BUTTON_TEXT = "Skip Ad";
const X_BUTTON_SVG_SELECTOR = 'button svg.lucide-x'; // Original X button

const PROMOTION_BANNER_SELECTOR = 'div.max-w-7xl.mx-auto.px-4.py-8.relative.z-20'; // The new banner container
const PROMOTION_CLOSE_BUTTON_SELECTOR = 'button[aria-label="Close promotion"]'; // New X button within the banner

function attemptClick(element, type = "Unknown") {
  if (element && typeof element.click === 'function') {
    element.click();
    console.log(`Asura AD Remover: Clicked ${type} element:`, element);
    chrome.runtime.sendMessage({ command: "increment_block_count" });
    // To prevent multiple counts for the same popup, we might want to disconnect
    // the observer temporarily or mark this popup as handled.
    // For now, let's assume popups are not rapidly re-inserted.
    return true;
  }
  return false;
}

function findAndClickButtons(parentElement) {
  if (!parentElement) return false;

  // Case 1: parentElement is the original modal popup
  if (parentElement.matches(POPUP_SELECTOR)) {
    // Try to find and click "Skip Ad" button by text content within this modal
    const skipButtons = parentElement.querySelectorAll('button');
    for (const button of skipButtons) {
      if (button.textContent.trim() === SKIP_AD_BUTTON_TEXT) {
        if (attemptClick(button, "Skip Ad Button (Modal)")) return true;
      }
    }
    // If "Skip Ad" not found, try the original "X" button (SVG based) within this modal
    const xButtonSvg = parentElement.querySelector(X_BUTTON_SVG_SELECTOR);
    if (xButtonSvg) {
      const actualXButton = xButtonSvg.closest('button');
      if (attemptClick(actualXButton, "Original X Button (Modal)")) return true;
    }
  }

  // Case 2: parentElement is the new promotion banner (or the button itself if directly passed)
  // Try the new "Close promotion" button by aria-label
  let promoCloseButton = null;
  if (parentElement.matches(PROMOTION_CLOSE_BUTTON_SELECTOR)) {
    promoCloseButton = parentElement; // The parentElement is the button itself
  } else {
    // Look for the button within the parentElement (e.g., parentElement is the banner)
    promoCloseButton = parentElement.querySelector(PROMOTION_CLOSE_BUTTON_SELECTOR);
  }
  
  if (promoCloseButton) {
    if (attemptClick(promoCloseButton, "Promotion Close Button (Banner)")) return true;
  }
  
  return false;
}

function observeDOM() {
  if (observer) observer.disconnect(); // Disconnect previous observer if any

  observer = new MutationObserver((mutationsList, obs) => {
    if (!isExtensionEnabled) {
        obs.disconnect(); // Stop observing if extension gets disabled
        observer = null;
        return;
    }
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node itself is the main modal popup
            if (node.matches(POPUP_SELECTOR)) {
              console.log("Asura AD Remover: Main Modal Popup detected directly.", node);
              if (findAndClickButtons(node)) return; // Exit after handling
            }
            // Check if the added node is the new promotion banner
            else if (node.matches(PROMOTION_BANNER_SELECTOR)) {
                console.log("Asura AD Remover: Promotion Banner detected directly.", node);
                if (findAndClickButtons(node)) return; 
            }
            // Check if the added node is the promotion close button itself (less likely if banner is wrapper)
            else if (node.matches(PROMOTION_CLOSE_BUTTON_SELECTOR)) {
                 console.log("Asura AD Remover: Promotion Close Button (direct) detected.", node);
                 if (findAndClickButtons(node)) return;
            }
            // Fallback: Check for descendants
            else {
              const modalPopup = node.querySelector(POPUP_SELECTOR);
              if (modalPopup) {
                console.log("Asura AD Remover: Main Modal Popup (descendant) detected.", modalPopup);
                if (findAndClickButtons(modalPopup)) return;
              }
              const promoBanner = node.querySelector(PROMOTION_BANNER_SELECTOR);
              if (promoBanner) {
                  console.log("Asura AD Remover: Promotion Banner (descendant) detected.", promoBanner);
                  if (findAndClickButtons(promoBanner)) return;
              }
              // It's unlikely the close button would be a descendant without the banner, but good to check.
              const promoButtonDescendant = node.querySelector(PROMOTION_CLOSE_BUTTON_SELECTOR);
              if (promoButtonDescendant && !promoBanner) { // only if not already handled by banner check
                  console.log("Asura AD Remover: Promotion Close Button (descendant, no banner found first) detected.", promoButtonDescendant);
                  if (findAndClickButtons(promoButtonDescendant)) return;
              }
            }
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  console.log("Asura AD Remover: DOM Observer started.");
}

function initialize() {
  chrome.storage.local.get("isEnabled", (result) => {
    isExtensionEnabled = !!result.isEnabled;
    console.log("Asura AD Remover (Content Script): Initial state - Enabled:", isExtensionEnabled);
    if (isExtensionEnabled) {
      observeDOM();
    } else {
      if (observer) {
        observer.disconnect();
        observer = null;
        console.log("Asura AD Remover: DOM Observer stopped initially (disabled).");
      }
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'state_updated') {
    console.log("Asura AD Remover (Content Script): Received state update - Enabled:", request.isEnabled);
    isExtensionEnabled = request.isEnabled;
    if (isExtensionEnabled && !observer) {
      observeDOM();
    } else if (!isExtensionEnabled && observer) {
      observer.disconnect();
      observer = null;
      console.log("Asura AD Remover: DOM Observer stopped by state update.");
    }
  }
});

// Check for existing popups on script load, as MutationObserver only sees changes
function checkForExistingPopups() {
    if (!isExtensionEnabled) return;
    
    // Check for main modal popup
    document.querySelectorAll(POPUP_SELECTOR).forEach(popup => {
        console.log("Asura AD Remover: Existing Main Modal Popup found on load.", popup);
        findAndClickButtons(popup);
    });

    // Check for existing promotion banners (which contain the close button)
    document.querySelectorAll(PROMOTION_BANNER_SELECTOR).forEach(banner => {
        console.log("Asura AD Remover: Existing Promotion Banner found on load.", banner);
        findAndClickButtons(banner); 
    });
    
    // As a fallback, directly check for orphaned promotion close buttons (less likely)
    // This might be redundant if the banner check is robust
    document.querySelectorAll(PROMOTION_CLOSE_BUTTON_SELECTOR).forEach(button => {
        // To avoid double-processing if already handled by banner check, we could add a check here
        // e.g., if (!button.closest(PROMOTION_BANNER_SELECTOR)) { ... }
        // For now, simple check:
        console.log("Asura AD Remover: Existing orphaned Promotion Close Button found on load.", button);
        findAndClickButtons(button); 
    });
}

// Run initialization
initialize();
// After a brief delay to ensure DOM is somewhat stable and initial state is loaded.
setTimeout(checkForExistingPopups, 1000);

console.log("Asura AD Remover: Content script loaded."); 