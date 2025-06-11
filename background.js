// Service worker for YouTube Transcript Sender
console.log('YouTube Transcript Sender: Background service worker started');

// Store transcript data temporarily
let transcriptData = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Transcript Sender installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.type === 'open-chatgpt') {
    handleOpenService('chatgpt', request.transcript, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.type === 'open-claude') {
    handleOpenService('claude', request.transcript, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.type === 'error') {
    console.error('Error from content script:', request.message);
  } else if (request.type === 'log') {
    console.log('Log from content script:', request.message);
  }
  
  // Send acknowledgment
  sendResponse({received: true});
  return true;
});

// Handle opening service and injecting transcript
async function handleOpenService(service, transcript, sendResponse) {
  try {
    // Store transcript data
    transcriptData = transcript;
    
    // Determine URL based on service
    const url = service === 'chatgpt' 
      ? 'https://chatgpt.com' 
      : 'https://claude.ai/new';
    
    // Create new tab
    const tab = await chrome.tabs.create({ url, active: true });
    
    // Wait for tab to load
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        
        // Inject the transcript after a short delay to ensure page is ready
        setTimeout(() => {
          injectTranscript(tabId, service);
        }, 1500);
      }
    });
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error opening service:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Inject transcript into the service page
async function injectTranscript(tabId, service) {
  try {
    // Define the injection script based on service
    const injectionScript = service === 'chatgpt' 
      ? injectIntoChatGPT 
      : injectIntoClaude;
    
    // Execute the injection script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: injectionScript,
      args: [transcriptData]
    });
    
    console.log(`Transcript injected into ${service}`);
  } catch (error) {
    console.error(`Error injecting transcript into ${service}:`, error);
  }
}

// Function to inject into ChatGPT
function injectIntoChatGPT(transcript) {
  console.log('Injecting into ChatGPT...');
  
  // Wait for the input to be available
  const waitForInput = setInterval(() => {
    // Try multiple selectors for ChatGPT input
    const selectors = [
      '#prompt-textarea',
      'textarea[data-id="root"]',
      'textarea[placeholder*="Send a message"]',
      'textarea[placeholder*="Ask anything"]',
      '.ProseMirror',
      '[contenteditable="true"]'
    ];
    
    let input = null;
    for (const selector of selectors) {
      input = document.querySelector(selector);
      if (input) break;
    }
    
    if (input) {
      clearInterval(waitForInput);
      
      // For contenteditable divs (like ProseMirror)
      if (input.contentEditable === 'true') {
        // Clear any placeholder
        input.innerHTML = '';
        
        // Create paragraph with text
        const p = document.createElement('p');
        p.textContent = transcript;
        input.appendChild(p);
        
        // Trigger input event
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Focus the input
        input.focus();
        
        // Move cursor to end
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(input);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // For regular textareas
        input.value = transcript;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      }
      
      console.log('Transcript injected successfully into ChatGPT');
    }
  }, 500);
  
  // Stop trying after 10 seconds
  setTimeout(() => clearInterval(waitForInput), 10000);
}

// Function to inject into Claude
function injectIntoClaude(transcript) {
  console.log('Injecting into Claude...');
  
  // Wait for the input to be available
  const waitForInput = setInterval(() => {
    // Try multiple selectors for Claude input
    const selectors = [
      '.ProseMirror',
      '[contenteditable="true"]',
      'div[aria-label*="Write your prompt"]',
      'div[contenteditable="true"][enterkeyhint="enter"]'
    ];
    
    let input = null;
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      // Claude might have multiple contenteditable elements, find the right one
      for (const el of elements) {
        if (el.getAttribute('aria-label')?.includes('prompt') || 
            el.className?.includes('ProseMirror') ||
            el.closest('[aria-label*="Write your prompt"]')) {
          input = el;
          break;
        }
      }
      if (input) break;
    }
    
    if (input) {
      clearInterval(waitForInput);
      
      // Clear any placeholder
      input.innerHTML = '';
      
      // Create paragraph with text
      const p = document.createElement('p');
      p.textContent = transcript;
      input.appendChild(p);
      
      // Trigger input event
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new InputEvent('input', { 
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: transcript
      }));
      
      // Focus the input
      input.focus();
      
      // Move cursor to end
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      
      console.log('Transcript injected successfully into Claude');
    }
  }, 500);
  
  // Stop trying after 10 seconds
  setTimeout(() => clearInterval(waitForInput), 10000);
}