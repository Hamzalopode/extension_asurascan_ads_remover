console.log('This is a popup!');

document.addEventListener('DOMContentLoaded', () => {
  const statusElement = document.getElementById('status');
  const toggleButton = document.getElementById('toggleButton');
  const blockCountElement = document.getElementById('blockCount');
  const lloydFaceImg = document.getElementById('lloyd-face'); // Get Lloyd image element

  // Set random Lloyd face and position
  if (lloydFaceImg) {
    try {
      // Set Image Source
      const randomIndex = Math.floor(Math.random() * 19); // Random integer 0-18
      lloydFaceImg.src = `../images/lloyd_${randomIndex}.png`;
      lloydFaceImg.alt = `Lloyd Face ${randomIndex}`;

      // Set Random Position (Left or Right)
      const positionClass = Math.random() < 0.5 ? 'lloyd-left' : 'lloyd-right';
      lloydFaceImg.classList.add(positionClass);

    } catch (error) {
        console.error("Error setting Lloyd image:", error);
        // Hide the image element if there was an error setting the source
        lloydFaceImg.style.display = 'none'; 
    }
  }

  // Request initial state and count from background script
  chrome.runtime.sendMessage({ command: 'get_initial_state' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting initial state:', chrome.runtime.lastError.message);
      statusElement.textContent = 'Error';
      return;
    }
    updateUI(response.isEnabled, response.blockedCount);
  });

  toggleButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'toggle_state' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error toggling state:', chrome.runtime.lastError.message);
        statusElement.textContent = 'Error';
        return;
      }
      updateUI(response.isEnabled, response.blockedCount);
    });
  });

  // Listen for state changes from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'state_updated') {
      updateUI(request.isEnabled, request.blockedCount);
    }
  });

  function updateUI(isEnabled, count) {
    // Update Status Badge Text and Class
    statusElement.textContent = isEnabled ? 'ON' : 'OFF';
    if (isEnabled) {
      statusElement.classList.add('status-on');
    } else {
      statusElement.classList.remove('status-on');
    }

    // Update Block Count
    blockCountElement.textContent = count !== undefined ? count : '0';
    
    // Update Toggle Button Text
    toggleButton.textContent = isEnabled ? 'Turn OFF' : 'Turn ON';
  }
});