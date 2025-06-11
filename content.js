console.log('YouTube Transcript Sender: Script loaded');

let transcriptText = '';
let videoTitle = '';

// Function to extract transcript with multiple selector strategies
function extractTranscript() {
  console.log('YouTube Transcript Sender: Attempting to extract transcript...');
  
  // Multiple strategies to find the transcript panel
  const panelSelectors = [
    'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-transcript"]',
    'ytd-engagement-panel-section-list-renderer[visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"]',
    '#panels ytd-engagement-panel-section-list-renderer'
  ];
  
  let transcriptPanel = null;
  for (const selector of panelSelectors) {
    transcriptPanel = document.querySelector(selector);
    if (transcriptPanel && transcriptPanel.offsetParent !== null) {
      console.log(`YouTube Transcript Sender: Found panel with selector: ${selector}`);
      break;
    }
  }
  
  if (!transcriptPanel) {
    console.log('YouTube Transcript Sender: No transcript panel found');
    return false;
  }
  
  // Try multiple approaches to extract transcript segments
  const segmentStrategies = [
    // Strategy 1: Standard segment renderer
    () => {
      const segments = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');
      if (segments.length > 0) {
        return Array.from(segments).map(segment => {
          const timestampEl = segment.querySelector('.segment-timestamp');
          const textEl = segment.querySelector('.segment-text');
          const timestamp = timestampEl?.textContent?.trim() || '';
          const text = textEl?.textContent?.trim() || '';
          return { timestamp, text };
        });
      }
      return null;
    },
    
    // Strategy 2: Look for cue groups (newer YouTube structure)
    () => {
      const cueGroups = transcriptPanel.querySelectorAll('[class*="cue-group"]');
      if (cueGroups.length > 0) {
        return Array.from(cueGroups).map(group => {
          const elements = group.querySelectorAll('[class*="cue"]');
          let timestamp = '';
          let text = '';
          elements.forEach(el => {
            const content = el.textContent?.trim();
            if (content && /^\d{1,2}:\d{2}/.test(content)) {
              timestamp = content;
            } else if (content) {
              text = content;
            }
          });
          return { timestamp, text };
        });
      }
      return null;
    },
    
    // Strategy 3: Find all text content and parse
    () => {
      const allText = [];
      const textElements = transcriptPanel.querySelectorAll('yt-formatted-string, span');
      let currentTimestamp = '';
      
      textElements.forEach(el => {
        const text = el.textContent?.trim();
        if (!text || text.length === 0) return;
        
        // Check if it's a timestamp
        if (/^\d{1,2}:\d{2}/.test(text)) {
          currentTimestamp = text;
        } else if (currentTimestamp && !text.includes('Transcript') && text.length > 1) {
          allText.push({ timestamp: currentTimestamp, text });
          currentTimestamp = '';
        }
      });
      
      return allText.length > 0 ? allText : null;
    }
  ];
  
  // Try each strategy
  for (const strategy of segmentStrategies) {
    const segments = strategy();
    if (segments && segments.length > 0) {
      transcriptText = segments
        .map(seg => seg.timestamp && seg.text ? `${seg.timestamp} ${seg.text}` : seg.text)
        .filter(line => line && line.length > 0)
        .join('\n');
      
      console.log(`YouTube Transcript Sender: Extracted ${segments.length} segments`);
      return true;
    }
  }
  
  console.log('YouTube Transcript Sender: Could not extract transcript segments');
  return false;
}

// Function to get video title
function getVideoTitle() {
  const selectors = [
    'h1 yt-formatted-string.ytd-watch-metadata',
    'h1.ytd-watch-metadata yt-formatted-string',
    '#title h1 yt-formatted-string',
    'ytd-watch-metadata h1 yt-formatted-string'
  ];
  
  for (const selector of selectors) {
    const titleEl = document.querySelector(selector);
    if (titleEl && titleEl.textContent) {
      videoTitle = titleEl.textContent.trim();
      console.log('YouTube Transcript Sender: Found video title:', videoTitle);
      return true;
    }
  }
  
  // Fallback: try to get from page title
  const pageTitle = document.title;
  if (pageTitle && pageTitle.includes(' - YouTube')) {
    videoTitle = pageTitle.replace(' - YouTube', '').trim();
    console.log('YouTube Transcript Sender: Found video title from page:', videoTitle);
    return true;
  }
  
  console.log('YouTube Transcript Sender: Could not find video title');
  return false;
}

// Function to wait for transcript panel to open
async function waitForTranscript() {
  console.log('YouTube Transcript Sender: Waiting for transcript panel...');
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 40; // 20 seconds
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Also check if the panel is still animating
      const panel = document.querySelector('ytd-engagement-panel-section-list-renderer');
      const isAnimating = panel?.getAttribute('visibility') === 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED';
      
      if (extractTranscript()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.log('YouTube Transcript Sender: Timeout waiting for transcript');
        resolve(false);
      } else if (isAnimating && attempts > 5) {
        // Give animation time to complete
        console.log('YouTube Transcript Sender: Panel is animating...');
      }
    }, 500);
  });
}

// Function to expand description if needed
async function expandDescriptionIfNeeded() {
  const expandButton = document.querySelector('tp-yt-paper-button#expand');
  
  if (expandButton && expandButton.offsetParent !== null) {
    console.log('YouTube Transcript Sender: Expanding description...');
    expandButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }
  return false;
}

// Function to open transcript panel
async function openTranscriptPanel() {
  console.log('YouTube Transcript Sender: Attempting to open transcript panel...');
  
  // First, check if transcript is already open
  if (extractTranscript()) {
    console.log('YouTube Transcript Sender: Transcript already available');
    return true;
  }
  
  // Expand description if needed
  await expandDescriptionIfNeeded();
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Look for the transcript button with multiple selectors
  const buttonSelectors = [
    'button[aria-label="Show transcript"]',
    'ytd-button-renderer button[title*="transcript"]',
    'ytd-button-renderer button[aria-label*="transcript"]',
    '#primary-button button'
  ];
  
  let transcriptButton = null;
  for (const selector of buttonSelectors) {
    transcriptButton = document.querySelector(selector);
    if (transcriptButton) {
      console.log(`YouTube Transcript Sender: Found button with selector: ${selector}`);
      break;
    }
  }
  
  if (transcriptButton) {
    console.log('YouTube Transcript Sender: Clicking transcript button...');
    transcriptButton.click();
    
    // Wait for panel to open and transcript to load
    const success = await waitForTranscript();
    return success;
  }
  
  console.log('YouTube Transcript Sender: Could not find transcript button');
  return false;
}

// Function to format and send to ChatGPT/Claude
function formatTranscript() {
  const url = window.location.href;
  const includeInstructions = document.getElementById('ts-include-instructions')?.checked ?? true;
  
  if (includeInstructions) {
    const instructions = `When I receive a YouTube video title and its transcript, I must do the following in order:

# 1
Write a One-Sentence, Anti-Clickbait Headline
This should read like a direct, informative news or article headline.
It must summarize the video's main takeaway in plain language.
Do not ask a question. Never use phrases like "so why did we…" or "could this be…?"
It should quickly give the user the main point without needing to think or dig deeper.
Example (Correct):
"Awnings can cut your cooling bill by 20% — we ditched them because air conditioning replaced passive design."
Example (Incorrect):
"Awnings can cut your cooling bill by 20% — so why did we ditch them?"

# 2
Answer the YouTube Title
If the video title is a question, answer it directly with a clear and brief summary of the creator's answer.
If the title is a statement, explain the implied question and provide the creator's conclusion or answer.
This should clarify what the viewer would learn or understand by watching the video.

# 3
Bullet Point Breakdown
List every notable point, claim, or commentary the creator makes.
Keep each bullet point short, clear, and in plain language.
Follow the chronological or logical order of the video.
Include any major supporting examples, data, or insights provided.

# 4
Verdict: Is the Video Worthwhile?
Clearly state whether the video is:
Useful and informative
Somewhat vague or repetitive
Clickbait, fluff, or a time sink
Base this judgment on how much concrete, novel, or actionable information the video delivers.
Be honest, helpful, and concise.

---

YouTube Video: ${videoTitle}
URL: ${url}

Transcript:
${transcriptText}`;
    
    return instructions;
  } else {
    return `YouTube Video: ${videoTitle}\nURL: ${url}\n\nTranscript:\n${transcriptText}`;
  }
}

// Function to copy to clipboard with retry mechanism
async function copyToClipboard(text) {
  // Method 1: Try modern clipboard API
  try {
    await navigator.clipboard.writeText(text);
    console.log('YouTube Transcript Sender: Copied using clipboard API');
    return true;
  } catch (err) {
    console.log('YouTube Transcript Sender: Clipboard API failed, trying fallback...', err.message);
  }
  
  // Method 2: Fallback with execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    
    textArea.select();
    textArea.setSelectionRange(0, text.length);
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (success) {
      console.log('YouTube Transcript Sender: Copied using execCommand');
      return true;
    }
  } catch (err) {
    console.error('YouTube Transcript Sender: execCommand failed:', err);
  }
  
  return false;
}

// Create the UI
function createUI() {
  console.log('YouTube Transcript Sender: Creating UI...');
  
  // Check if UI already exists
  if (document.getElementById('transcript-sender-ui')) {
    console.log('YouTube Transcript Sender: UI already exists');
    attachEventListeners(); // Re-attach listeners
    return;
  }
  
  // Check if we're on a video page
  if (!window.location.pathname.includes('/watch')) {
    console.log('YouTube Transcript Sender: Not a video page, skipping UI creation');
    return;
  }
  
  const container = document.createElement('div');
  container.id = 'transcript-sender-ui';
  container.innerHTML = `
    <div class="ts-header">Send Transcript To:</div>
    <div class="ts-buttons">
      <button id="ts-chatgpt" class="ts-button" title="Send transcript to ChatGPT">ChatGPT</button>
      <button id="ts-claude" class="ts-button" title="Send transcript to Claude">Claude</button>
      <button id="ts-download" class="ts-button" title="Download transcript as text file">Download</button>
    </div>
    <div class="ts-options" style="margin-top: 8px; font-size: 12px;">
      <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
        <input type="checkbox" id="ts-include-instructions" checked style="cursor: pointer;">
        <span>Include analysis instructions</span>
      </label>
    </div>
    <div id="ts-status" class="ts-status"></div>
  `;
  
  // Find the insertion point
  const insertionStrategies = [
    () => {
      const relatedChips = document.querySelector('yt-related-chip-cloud-renderer');
      if (relatedChips && relatedChips.parentElement) {
        relatedChips.parentElement.insertBefore(container, relatedChips);
        return true;
      }
      return false;
    },
    () => {
      const secondary = document.querySelector('#secondary');
      if (secondary) {
        secondary.insertBefore(container, secondary.firstChild);
        return true;
      }
      return false;
    },
    () => {
      const secondaryInner = document.querySelector('#secondary-inner');
      if (secondaryInner) {
        secondaryInner.insertBefore(container, secondaryInner.firstChild);
        return true;
      }
      return false;
    }
  ];
  
  let inserted = false;
  for (const strategy of insertionStrategies) {
    if (strategy()) {
      inserted = true;
      console.log('YouTube Transcript Sender: UI inserted successfully');
      break;
    }
  }
  
  if (!inserted) {
    console.error('YouTube Transcript Sender: Could not find insertion point');
    return;
  }
  
  // Attach event listeners
  attachEventListeners();
  
  // Load saved preferences
  loadPreferences();
}

// Attach event listeners to buttons
function attachEventListeners() {
  const chatGPTBtn = document.getElementById('ts-chatgpt');
  const claudeBtn = document.getElementById('ts-claude');
  const downloadBtn = document.getElementById('ts-download');
  const instructionsCheckbox = document.getElementById('ts-include-instructions');
  
  if (chatGPTBtn) {
    chatGPTBtn.removeEventListener('click', handleChatGPT);
    chatGPTBtn.addEventListener('click', handleChatGPT);
    console.log('YouTube Transcript Sender: ChatGPT button listener attached');
  }
  
  if (claudeBtn) {
    claudeBtn.removeEventListener('click', handleClaude);
    claudeBtn.addEventListener('click', handleClaude);
    console.log('YouTube Transcript Sender: Claude button listener attached');
  }
  
  if (downloadBtn) {
    downloadBtn.removeEventListener('click', handleDownload);
    downloadBtn.addEventListener('click', handleDownload);
    console.log('YouTube Transcript Sender: Download button listener attached');
  }
  
  if (instructionsCheckbox) {
    instructionsCheckbox.addEventListener('change', savePreferences);
  }
}

// Save preferences to localStorage
function savePreferences() {
  const includeInstructions = document.getElementById('ts-include-instructions')?.checked ?? true;
  localStorage.setItem('yt-transcript-sender-instructions', includeInstructions);
  console.log('YouTube Transcript Sender: Preferences saved');
}

// Load preferences from localStorage
function loadPreferences() {
  const saved = localStorage.getItem('yt-transcript-sender-instructions');
  if (saved !== null) {
    const checkbox = document.getElementById('ts-include-instructions');
    if (checkbox) {
      checkbox.checked = saved === 'true';
    }
  }
}

// Check extension health periodically
function checkExtensionHealth() {
  if (!chrome.runtime || !chrome.runtime.id) {
    console.warn('YouTube Transcript Sender: Extension context lost');
    const statusEl = document.getElementById('ts-status');
    if (statusEl) {
      statusEl.textContent = 'Extension reloaded - please refresh the page';
      statusEl.className = 'ts-status error';
    }
    // Disable buttons
    ['ts-chatgpt', 'ts-claude', 'ts-download'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = true;
    });
    return false;
  }
  return true;
}

// Show status message
function showStatus(message, isError = false) {
  console.log(`YouTube Transcript Sender: Status - ${message}`);
  const statusEl = document.getElementById('ts-status');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `ts-status ${isError ? 'error' : 'success'}`;
    
    if (message) {
      // Keep success messages longer
      const duration = message.includes('✓') ? 8000 : 5000;
      setTimeout(() => {
        if (statusEl.textContent === message) {
          statusEl.textContent = '';
          statusEl.className = 'ts-status';
        }
      }, duration);
    }
  }
}



// Handle ChatGPT button click
async function handleChatGPT(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log('YouTube Transcript Sender: ChatGPT button clicked');
  
  // Check if extension is still valid
  if (!checkExtensionHealth()) {
    return;
  }
  
  await handleTranscriptAction('ChatGPT', 'https://chat.openai.com');
}

// Handle Claude button click  
async function handleClaude(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log('YouTube Transcript Sender: Claude button clicked');
  
  // Check if extension is still valid
  if (!checkExtensionHealth()) {
    return;
  }
  
  await handleTranscriptAction('Claude', 'https://claude.ai');
}

// Common handler for both ChatGPT and Claude
async function handleTranscriptAction(serviceName, serviceUrl) {
  try {
    showStatus('Extracting transcript...');
    
    if (!getVideoTitle()) {
      showStatus('Could not find video title', true);
      return;
    }
    
    // Try to extract existing transcript first
    if (!extractTranscript()) {
      showStatus('Opening transcript panel...');
      const success = await openTranscriptPanel();
      if (!success) {
        showStatus('Could not extract transcript. Make sure the video has captions.', true);
        return;
      }
    }
    
    if (!transcriptText || transcriptText.length < 10) {
      showStatus('Transcript appears to be empty', true);
      return;
    }
    
    const formatted = formatTranscript();
    
    // Always copy to clipboard first
    const copied = await copyToClipboard(formatted);
    if (!copied) {
      showStatus('Failed to copy transcript', true);
      return;
    }
    
    showStatus(`Opening ${serviceName}...`);
    
    // Try to use the background script for auto-paste
    try {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        const messageType = serviceName === 'ChatGPT' ? 'open-chatgpt' : 'open-claude';
        
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: messageType,
            transcript: formatted
          }, (response) => {
            if (chrome.runtime.lastError) {
              // Extension context invalid, fall back to simple open
              reject(chrome.runtime.lastError);
            } else if (response && response.success) {
              showStatus(`✓ Transcript sent to ${serviceName}!`);
              resolve();
            } else {
              reject(new Error('Failed to send transcript'));
            }
          });
        });
      } else {
        throw new Error('Chrome runtime not available');
      }
    } catch (messageError) {
      console.log('YouTube Transcript Sender: Auto-paste unavailable, falling back to manual paste');
      // Fallback: Just open the tab and let user paste manually
      showStatus(`✓ Copied! Opening ${serviceName} - press Ctrl+V to paste`);
      window.open(serviceUrl, '_blank', 'noopener,noreferrer');
    }
    
  } catch (error) {
    console.error('YouTube Transcript Sender: Error in handleTranscriptAction:', error);
    showStatus('An error occurred. Please try again.', true);
  }
}

// Handle Download button click
async function handleDownload(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log('YouTube Transcript Sender: Download button clicked');
  
  try {
    showStatus('Extracting transcript...');
    
    if (!getVideoTitle()) {
      showStatus('Could not find video title', true);
      return;
    }
    
    // Try to extract existing transcript first
    if (!extractTranscript()) {
      showStatus('Opening transcript panel...');
      const success = await openTranscriptPanel();
      if (!success) {
        showStatus('Could not extract transcript. Make sure the video has captions.', true);
        return;
      }
    }
    
    if (!transcriptText || transcriptText.length < 10) {
      showStatus('Transcript appears to be empty', true);
      return;
    }
    
    const formatted = formatTranscript();
    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 100)}_transcript.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('Downloaded transcript!');
  } catch (error) {
    console.error('YouTube Transcript Sender: Error in handleDownload:', error);
    showStatus('Failed to download transcript', true);
  }
}

// Initialize on page load
function init() {
  console.log('YouTube Transcript Sender: Initializing...');
  
  // Check if extension context is valid
  if (!chrome.runtime || !chrome.runtime.id) {
    console.warn('YouTube Transcript Sender: Extension context invalid, extension may have been reloaded');
    return;
  }
  
  // Only run on video pages
  if (!window.location.pathname.includes('/watch')) {
    console.log('YouTube Transcript Sender: Not a video page, skipping');
    return;
  }
  
  // Reset state
  transcriptText = '';
  videoTitle = '';
  
  // Wait for page to load
  let attempts = 0;
  const maxAttempts = 30;
  
  const tryInit = () => {
    attempts++;
    console.log(`YouTube Transcript Sender: Init attempt ${attempts}`);
    
    // Check if essential elements are loaded
    const hasTitle = document.querySelector('h1 yt-formatted-string.ytd-watch-metadata') || 
                    document.title.includes(' - YouTube');
    const hasSecondary = document.querySelector('#secondary, #secondary-inner, yt-related-chip-cloud-renderer');
    
    if (hasTitle && hasSecondary) {
      createUI();
      console.log('YouTube Transcript Sender: Initialized successfully');
    } else if (attempts < maxAttempts) {
      setTimeout(tryInit, 500);
    } else {
      console.error('YouTube Transcript Sender: Failed to initialize after maximum attempts');
    }
  };
  
  tryInit();
}

// Listen for navigation changes (YouTube is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('YouTube Transcript Sender: Navigation detected');
    // Remove old UI
    const oldUI = document.getElementById('transcript-sender-ui');
    if (oldUI) {
      oldUI.remove();
    }
    // Reinitialize
    setTimeout(init, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Debug helper function
window.debugTranscriptSender = () => {
  const panel = document.querySelector('ytd-engagement-panel-section-list-renderer');
  const info = {
    videoTitle,
    transcriptLength: transcriptText.length,
    currentURL: window.location.href,
    hasUI: !!document.getElementById('transcript-sender-ui'),
    transcriptPanelFound: !!panel,
    transcriptPanelVisible: !!(panel?.offsetParent),
    transcriptButtonFound: !!document.querySelector('button[aria-label="Show transcript"]'),
    expandButtonFound: !!document.querySelector('tp-yt-paper-button#expand'),
    buttons: {
      chatgpt: !!document.getElementById('ts-chatgpt'),
      claude: !!document.getElementById('ts-claude'),
      download: !!document.getElementById('ts-download')
    }
  };
  console.log('YouTube Transcript Sender Debug Info:', info);
  return info;
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}