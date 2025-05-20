const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const chatbot = document.getElementById('chatbot');
const header = document.getElementById('chatbot-header');
const speakerButton = document.getElementById('speaker-btn');
const chatbotToggle = document.getElementById('chatbot-toggle');
const voiceButton = document.querySelector('.voice-btn');
const listeningIndicator = document.createElement('div');
listeningIndicator.classList.add('listening-indicator');
listeningIndicator.textContent = '      ➔Listening.......';

let isMuted = false;
let isListening = false;
let recognition;
let hasBeeped = false; // Ensure beep plays only once

// Function to toggle chatbot visibility
function toggleChatbot() {
    chatbot.classList.toggle('active');
    chatbotToggle.style.display = chatbot.classList.contains('active') ? 'none' : 'flex';
}

let chatHistory = [];
async function sendMessage(message, callback = null) {
    const chatInput = document.getElementById('chat-input');
    const fileUpload = document.getElementById('file-upload');

    const userMessage = message || chatInput.value.trim();
    if (!userMessage) return;

    chatInput.value = ''; // 🧹 Clear input

    // Display user's message
    displayMessage(userMessage, 'user');
    chatHistory.push({ role: 'user', content: userMessage });

    const thinkingMessage = document.createElement('div');
    thinkingMessage.classList.add('message', 'bot-message');
    thinkingMessage.textContent = '⏳ Thinking...';
    chatWindow.appendChild(thinkingMessage);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    if (fileUpload.files.length > 0) {
        sendFile();
        chatWindow.removeChild(thinkingMessage);
    } else {
        try {
            const response = await fetch('/chatbot/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: chatHistory
                })
            });

            const data = await response.json();
            console.log('Chatbot Response:', data);

            chatWindow.removeChild(thinkingMessage);
            displayMessage(data.response, 'bot');
            chatHistory.push({ role: 'assistant', content: data.response });

            // Speak and auto-continue if callback provided
            if (callback && typeof callback === 'function') {
                callback(data.response);
            }

            // Handle optional redirection
            if (data.url) {
                let newTab = window.open(data.url, '_blank');
                if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
                    displayMessage(`🔗 <a href="${data.url}" target="_blank">Click here to open</a>`, 'bot');
                }
            }

        } catch (error) {
            console.error('Error:', error);
            chatWindow.removeChild(thinkingMessage);
            displayMessage('❌ Error: Unable to connect to the chatbot.', 'bot');
        }
    }

    // Keep history limited
    if (chatHistory.length > 20) {
        chatHistory = chatHistory.slice(-20);
    }
}





let isSpeaking = false;
let currentUtterance = null;

function speakResponse(response, speakerIcon) {
    if (!response) return;

    const micButton = document.querySelector('.voice-btn');

    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakerIcon.textContent = '🔊';
        micButton.classList.remove('bot-speaking');
    } else {
        currentUtterance = new SpeechSynthesisUtterance(response);
        
        // Disable mic button when bot starts speaking
        micButton.classList.add('bot-speaking');
        
        currentUtterance.onend = () => {
            isSpeaking = false;
            speakerIcon.textContent = '🔇';
            // Re-enable mic button when bot finishes speaking
            micButton.classList.remove('bot-speaking');
        };
        
        window.speechSynthesis.speak(currentUtterance);
        isSpeaking = true;
        speakerIcon.textContent = '🔊';
    }
}

function displayMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    const rawText = message; // Save original for TTS

    // 🔹 Bullet Points (*text)
    message = message.replace(/(?:^|\n)((?:\*.+\n?)+)/g, (_, bullets) => {
        const listItems = bullets
            .trim()
            .split('\n')
            .map(line => line.trim().replace(/^\*\s?/, ''))
            .map(item => `<li>${item}</li>`)
            .join('');
        return `<ul>${listItems}</ul>`;
    });

    // 🔹 Bold (**text**)
    message = message.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

    // 🔹 Code Blocks (```lang\ncode```)
    message = message.replace(/```(\w*)\n([\s\S]+?)```/g, function (match, language, code) {
        let escapedCode = code
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        let langLabel = language || 'code';
        return `<div class="code-block-container">
                    <div class="code-header">
                        <div class="code-language">${langLabel}</div>
                        <button class="copy-btn" aria-label="Copy code">
                            <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    <pre class="code-block"><code class="language-${langLabel}">${escapedCode}</code></pre>
                </div>`;
    });

    // 🔹 Triple Single Quotes ('''\ncode''')
    message = message.replace(/'''\n?([\s\S]+?)'''/g, function (match, code) {
        let escapedCode = code
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        return `<div class="code-block-container">
                    <div class="code-header">
                        <div class="code-language">code</div>
                        <button class="copy-btn" aria-label="Copy code">
                            <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    <pre class="code-block"><code class="language-code">${escapedCode}</code></pre>
                </div>`;
    });

    // 🔹 Line breaks (excluding inside <code>)
    message = message.replace(/(?<!<\/code>)\n/g, '<br>');

    // 🔹 Wrap and inject message content
    const contentWrapper = document.createElement('span');
    contentWrapper.innerHTML = message;
    messageElement.appendChild(contentWrapper);

    // 🔊 Add speaker icon
    const speakerIcon = document.createElement('span');
    speakerIcon.className = 'speaker-icon';
    speakerIcon.textContent = '🔇';
    speakerIcon.style.marginLeft = '8px';
    speakerIcon.style.cursor = 'pointer';
    speakerIcon.addEventListener('click', () => {
        speakResponse(rawText, speakerIcon);
    });
    messageElement.appendChild(speakerIcon);

    // 🔹 Append to chat
    const chatWindow = document.getElementById('chat-window');
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // 🔹 Setup copy buttons
    messageElement.querySelectorAll(".copy-btn").forEach(button => {
        button.addEventListener("click", function () {
            copyCodeToClipboard(this);
        });
    });
}

function copyCodeToClipboard(button) {
    const codeElement = button.closest(".code-block-container").querySelector("code");

    if (!codeElement || !codeElement.innerText.trim()) {
        alert("Nothing to copy.");
        return;
    }

    const codeText = codeElement.innerText;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(codeText).then(() => {
            updateCopyButton(button);
            pasteIntoNotepad(codeText); // ✅ Auto-paste to notepad
        }).catch(() => {
            fallbackCopy(codeText, button);
        });
    } else {
        fallbackCopy(codeText, button);
    }
}

function fallbackCopy(text, button) {
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = text;
    tempTextArea.style.position = "fixed";
    tempTextArea.style.opacity = 0;
    document.body.appendChild(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();

    try {
        const success = document.execCommand("copy");
        if (success) {
            updateCopyButton(button);
            pasteIntoNotepad(text); // ✅ Auto-paste to notepad
        } else {
            throw new Error("Copy command failed");
        }
    } catch (err) {
        alert("Failed to copy code. Try manually.");
    }

    document.body.removeChild(tempTextArea);
}

function updateCopyButton(button) {
    button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="#40C057" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>`;

    setTimeout(() => {
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>`;
    }, 2000);
}




function pasteIntoNotepad(text) {
    const notepad = document.getElementById('notepad');
    if (notepad) {
        notepad.value = text; // Or use: notepad.value += '\n' + text; to append
        notepad.scrollTop = notepad.scrollHeight;
        notepad.focus();
    }
}

// Remove old DOMContentLoaded for wrapping pre code blocks dynamically (no longer needed)
// Chat input enter listener
function handleEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevents new line in textarea
        sendMessage(); // Calls sendMessage function
    }
}

// ✅ Add event listener using the named function
chatInput.addEventListener("keydown", handleEnter);


// Initial greeting from the bot
window.onload = function () {
    setTimeout(() => {
        const greetingMessage = "Hi! I am Ahana. What's your name?";
        displayMessage(greetingMessage, 'bot');
    }, 500);
};

// Function to start speech recognition
const stopButton = document.createElement('button');
stopButton.innerText = 'Stop';
stopButton.id = 'stopButton';
stopButton.style.cssText = `
    padding: 8px 15px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    display: none;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    margin-left: 10px;
    vertical-align: middle;
`;

// Insert stopButton and restart button next to the microphone button
const micButtonContainer = document.querySelector('.voice-controls');
micButtonContainer.appendChild(stopButton);
const restartButton = document.getElementById('restart-btn');
if (restartButton) {
    micButtonContainer.appendChild(restartButton);
}


// Function to start listening and activate the glow
function startSpeechRecognition() {
    if (isListening) return;
    isListening = true;

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.continuous = false;

    // Hide specific elements while preserving container styling
    const elementsToHide = [
        '.dropdown',
        '#chat-window',
        '.circular-menu',
        '#notepadContainer',
        '#file-info',
        '.upload-btn',
        '#chat-input',
        '.send-btn'
    ];

    // Hide each element individually
    elementsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.visibility = 'hidden';
            element.style.opacity = '0';
        }
    });

    // Keep voice control buttons visible and show restart button
    voiceButton.style.visibility = 'visible';
    voiceButton.style.opacity = '1';
    stopButton.style.display = 'block';
    
    // Show restart button
    const restartButton = document.getElementById('restart-btn');
    if (restartButton) {
        restartButton.style.display = 'block';
        restartButton.style.visibility = 'visible';
        restartButton.style.opacity = '1';
    }

    document.getElementById('listening-glow')?.classList.add('active');
    
    // Start speech recognition after a delay
    playBeep();

    setTimeout(() => {
        try {
            recognition.start();
        } catch (err) {
            console.warn('Recognition start error:', err);
        }
    }, 1500);

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('User:', transcript);
        sendMessage(transcript, speakAndRestart);
    };

    recognition.onend = () => {
        if (!isListening) {
            cleanupUI();
        }
    };

    recognition.onerror = (error) => {
        console.error('Speech recognition error:', error);
        isListening = false;
        try { recognition.abort(); } catch {}
        speechSynthesis.cancel();
        cleanupUI();
    };
}

// Function to stop and restart listening
function stopAndRestartListening() {
    // Stop current speech output and recognition
    speechSynthesis.cancel();
    if (recognition) {
        try {
            recognition.abort();
        } catch (e) {
            console.warn("Error aborting recognition:", e);
        }
    }

    // Wait a short time to fully reset, then restart listening
    setTimeout(() => {
        cleanupUI(); // Ensure UI and isListening are reset
        setTimeout(() => {
            startSpeechRecognition(); // Re-activate the mic
        }, 100); // slight delay ensures smooth re-init
    }, 100);
}

// 🔇 Stop Listening Handler
stopButton.addEventListener('click', () => {
    isListening = false;
    try { recognition.abort(); } catch {}
    speechSynthesis.cancel(); // ❌ Stop bot voice
    cleanupUI();
});

// 🧼 UI Reset Utility
function cleanupUI() {
    isListening = false;
    // Restore visibility of all elements
    const elementsToShow = [
        '.chatbot-header',
        '.dropdown',
        '#chat-window',
        '.circular-menu',
        '#notepadContainer',
        '#file-info',
        '.upload-btn',
        '#chat-input',
        '.send-btn'
    ];

    // Show each element individually
    elementsToShow.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.visibility = 'visible';
            element.style.opacity = '1';
        }
    });
    
    // Hide control buttons
    stopButton.style.display = 'none';
    const restartButton = document.getElementById('restart-btn');
    if (restartButton) {
        restartButton.style.display = 'none';
    }
    
    // Remove glow effect
    document.getElementById('listening-glow')?.classList.remove('active');
}

// 🔊 Bot Speech then Resume Listening
function speakAndRestart(botReply) {
    if (recognition && isListening) {
        try { recognition.abort(); } catch {}
    }

    const utterance = new SpeechSynthesisUtterance(botReply);
    utterance.lang = 'en-US';
    const micButton = document.querySelector('.voice-btn');
    
    // Disable mic while speaking
    micButton.classList.add('bot-speaking');

    utterance.onend = () => {
        // Re-enable mic when done speaking
        micButton.classList.remove('bot-speaking');
        if (isListening) {
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (err) {
                    console.warn('Restart error:', err);
                }
            }, 800);
        }
    };

    utterance.onerror = () => {
        micButton.classList.remove('bot-speaking');
    };

    speechSynthesis.speak(utterance);
}

// 🔔 Beep Sound
function playBeep() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    setTimeout(() => oscillator.stop(), 400);
}




// 🌙 Optional: Dark Mode Toggle
function toggleDarkMode() {
    const chatbot = document.getElementById('chatbot');
    chatbot.classList.toggle('dark-mode');
}

// Function to toggle mute/unmute
function toggleMute() {
    isMuted = !isMuted;
    speakerButton.textContent = isMuted ? "🔇" : "🔊";
}

chatbot.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', null); // For Firefox compatibility
    const rect = chatbot.getBoundingClientRect();
    chatbot.dataset.offsetX = e.clientX - rect.left;
    chatbot.dataset.offsetY = e.clientY - rect.top;
});

voiceButton.addEventListener('click', startSpeechRecognition);

function toggleDropdown() {
    const menu = document.getElementById('dropdown-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Allowed file extensions
const allowedExtensions = ["pdf", "docx", "txt", "jpg","jpeg", "png", "csv", "xlsx"];

// Function to get the file icon based on extension
function getFileIcon(extension) {
    switch (extension) {
        case "pdf":
            return "📄"; // PDF icon
        case "docx":
            return "📝"; // Word doc icon
        case "txt":
            return "📃"; // Text file icon
        case "jpg":
            return "🖼️"; // Image icon
        case "png":
            return "🖼️";
        case "jpeg":
            return "🖼️"; // Image icon
        case "csv":
            return "📊"; // Spreadsheet icon
        case "xlsx":
            return "📊"; // Excel file icon

        default:
            return "📁"; // Default icon
    }
}

// Handle file selection
function handleFileSelect() {
    const fileInput = document.getElementById("file-upload");

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(fileExt)) {
            alert("Invalid file type! Allowed: PDF, DOCX, TXT, JPG,JPEG,PNG,CSV,XLSX.");
            fileInput.value = ''; // Reset input
            return;
        }

        const fileIcon = getFileIcon(fileExt);
        document.getElementById("selected-file-name").textContent = `${fileIcon} ${fileName}`;
        document.getElementById("file-info").style.display = "flex";
    }
}

document.getElementById("file-upload").addEventListener("change", handleFileSelect);

// Cancel button to clear file
document.getElementById("cancel-button").addEventListener("click", function () {
    clearFileInput();
});

// Function to clear file input
function clearFileInput() {
    const fileInput = document.getElementById("file-upload");
    fileInput.value = '';
    document.getElementById("file-info").style.display = "none";
    document.getElementById("selected-file-name").textContent = '';
}

// Send file and query to backend

async function sendFile() {
    const fileInput = document.getElementById("file-upload");
    const queryInput = document.getElementById("chat-input");
    const queryText = queryInput?.value?.trim();

    if (!fileInput.files.length) {
        alert("Please upload a valid file.");
        return;
    }

    if (!queryInput) {
        alert("Please enter a query about the file.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("query", queryText);

    try {
        const response = await fetch("/upload/", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const file = fileInput.files[0];
        const fileExt = file.name.split('.').pop().toLowerCase();
        const fileIcon = getFileIcon(fileExt);

        // Display user message
        displayMessage(`${fileIcon} ${file.name}<br>${queryText}`, "user");

        // Display bot response
        displayMessage(data.response, "bot");

        // Reset input
        queryInput.value = "";
        clearFileInput();
    } catch (error) {
        console.error("Error:", error);
        displayMessage("Error processing the file.", "bot");
    }}


function autoResize(textarea) {
    textarea.style.height = "50px"; // Fixed base height
    let newHeight = textarea.scrollHeight;

    if (newHeight > 80) {
        textarea.style.height = "80px"; // Set max height
        textarea.style.overflowY = "auto"; // Enable scrolling
    } else {
        textarea.style.height = newHeight + "px"; // Adjust height
        textarea.style.overflowY = "hidden"; // Hide scrollbar when not needed
    }
}


//note pad functions

// Toggle Notepad Visibility
function toggleNotepad() {
    let notepad = document.getElementById("notepadContainer");
    if (notepad.style.display === "none" || notepad.style.display === "") {
        notepad.style.display = "block";
    } else {
        notepad.style.display = "none";
    }
}

// Toggle Feature Buttons in Circular Format
function toggleFeatureButtons() {
    let featureContainer = document.getElementById("feature-buttons");
    featureContainer.classList.toggle("show");
}

// Show notification inside chatbot
function showNotification(message) {
    const notif = document.getElementById("chatbotNotification");
    notif.textContent = message;
    notif.classList.add("show");

    setTimeout(() => {
        notif.classList.remove("show");
    }, 2000);
}

// Save Notepad Content
document.getElementById("saveNote").addEventListener("click", function () {
    let text = document.getElementById("notepad").value;
    localStorage.setItem("notepadText", text);
    showNotification("Note saved!");
});

// Load Notepad Content on Page Load
window.onload = function () {
    let savedText = localStorage.getItem("notepadText");
    if (savedText) {
        document.getElementById("notepad").value = savedText;
    }
};

// Delete Notepad Content
document.getElementById("deleteNote").addEventListener("click", function () {
    document.getElementById("notepad").value = "";
    localStorage.removeItem("notepadText");
    showNotification("Note cleared!");
});

// Download Notepad Content
document.getElementById("downloadNote").addEventListener("click", function () {
    let text = document.getElementById("notepad").value;
    if (text === "") {
        showNotification("Nothing to download!");
        return;
    }
    let blob = new Blob([text], { type: "text/plain" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "note.txt";
    a.click();
});

// Cancel Notepad (Closes the notepad without deleting text)
document.getElementById("cancelNote").addEventListener("click", function () {
    document.getElementById("notepadContainer").style.display = "none";
});





