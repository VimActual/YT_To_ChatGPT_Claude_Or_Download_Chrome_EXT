document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('url-input');
  const goButton = document.getElementById('go-button');
  const statusEl = document.getElementById('status');
  const currentVideoDiv = document.getElementById('current-video');
  const videoTitleSpan = document.getElementById('video-title');
  
  // Check current tab
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0] && tabs[0].url && tabs[0].url.includes('youtube.com/watch')) {
      // Extract video title from page title
      const pageTitle = tabs[0].title;
      const videoTitle = pageTitle.replace(' - YouTube', '').trim();
      
      if (videoTitle) {
        videoTitleSpan.textContent = videoTitle;
        currentVideoDiv.classList.add('visible');
      }
      
      statusEl.textContent = 'Transcript buttons are available on the video page';
      statusEl.className = 'success';
    }
  });
  
  // Function to validate and extract video ID
  function extractVideoId(input) {
    // Remove any whitespace
    input = input.trim();
    
    // Check for youtube.com/watch?v=VIDEO_ID format
    const watchMatch = input.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
      return watchMatch[1];
    }
    
    // Check for youtu.be/VIDEO_ID format
    const shortMatch = input.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
      return shortMatch[1];
    }
    
    // Check for youtube.com/embed/VIDEO_ID format
    const embedMatch = input.match(/youtube\.com\/embed\/([^?]+)/);
    if (embedMatch) {
      return embedMatch[1];
    }
    
    // Check for youtube.com/v/VIDEO_ID format
    const vMatch = input.match(/youtube\.com\/v\/([^?]+)/);
    if (vMatch) {
      return vMatch[1];
    }
    
    // Check if it's just a video ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }
    
    return null;
  }
  
  // Handle button click
  async function handleGoToVideo() {
    const inputValue = urlInput.value.trim();
    
    if (!inputValue) {
      statusEl.textContent = 'Please enter a URL or video ID';
      statusEl.className = 'error';
      return;
    }
    
    // Disable button during processing
    goButton.disabled = true;
    statusEl.textContent = 'Processing...';
    statusEl.className = '';
    
    const videoId = extractVideoId(inputValue);
    
    if (videoId) {
      // Open the video in a new tab
      const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      try {
        const tab = await chrome.tabs.create({ url: fullUrl });
        
        statusEl.textContent = 'Opening video...';
        statusEl.className = 'success';
        
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1000);
      } catch (error) {
        console.error('Error opening tab:', error);
        statusEl.textContent = 'Failed to open video';
        statusEl.className = 'error';
        goButton.disabled = false;
      }
    } else {
      statusEl.textContent = 'Invalid YouTube URL or video ID';
      statusEl.className = 'error';
      goButton.disabled = false;
      
      // Select the input text for easy correction
      urlInput.select();
    }
  }
  
  // Button click handler
  goButton.addEventListener('click', handleGoToVideo);
  
  // Allow Enter key to submit
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !goButton.disabled) {
      handleGoToVideo();
    }
  });
  
  // Clear status when typing
  urlInput.addEventListener('input', () => {
    if (statusEl.className === 'error') {
      statusEl.textContent = '';
      statusEl.className = '';
    }
  });
  
  // Handle paste events
  urlInput.addEventListener('paste', (e) => {
    // Allow paste to complete before processing
    setTimeout(() => {
      const pastedText = urlInput.value;
      if (pastedText && extractVideoId(pastedText)) {
        // Valid URL was pasted, show visual feedback
        urlInput.style.borderColor = '#0d7a3e';
        setTimeout(() => {
          urlInput.style.borderColor = '';
        }, 1000);
      }
    }, 10);
  });
  
  // Focus on input when popup opens
  urlInput.focus();
});