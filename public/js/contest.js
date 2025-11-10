// Contest page JavaScript for code execution

// DOM elements (will be initialized on page load)
 let codeEditor;
 let languageSelect;
 let runCodeBtn;
 let submitCodeBtn;
 let outputContent;
 let clearOutputBtn;
 // Store last execution result so submit can send output without re-executing
 let lastExecutionResult = null;
 let nextQuestionBtn;
 let prevQuestionBtn;// Language-specific code templates
const codeTemplates = {
  python: `# Write your code here
def solve():
    pass

# Test your code
if __name__ == "__main__":
    solve()`,
  c: `#include <stdio.h>

int main() {
    // Write your code here
    
    return 0;
}`,
  java: `// Class will be Main
  public class Main {
    public static void main(String[] args) {
        // Write your code here
        
    }
}`
};

// Initialize code editor with template for current language
function initializeCodeEditor() {
  if (!codeEditor || !languageSelect) {
    return;
  }
  
  const language = languageSelect.value;
  if (codeTemplates[language] && !codeEditor.value.trim()) {
    codeEditor.value = codeTemplates[language];
  }
}

// Language change listener is set up in DOMContentLoaded handler

// Initialize on page load
document.addEventListener("DOMContentLoaded", function() {
  // Get DOM elements
  codeEditor = document.getElementById("code-editor");
  languageSelect = document.getElementById("language");
  runCodeBtn = document.getElementById("run-code-btn");
  submitCodeBtn = document.getElementById("submit-code-btn");
  outputContent = document.getElementById("output-content");
  clearOutputBtn = document.getElementById("clear-output-btn");
  
  // Initialize code editor
  if (codeEditor && languageSelect) {
    initializeCodeEditor();
    
    // Update code template when language changes
    languageSelect.addEventListener("change", function() {
      const language = this.value;
      if (codeTemplates[language]) {
        codeEditor.value = codeTemplates[language];
      }
    });
  }
  
  // Setup event listeners after DOM is loaded
  if (clearOutputBtn && outputContent) {
    clearOutputBtn.addEventListener("click", function() {
      outputContent.innerHTML = '<p class="output-placeholder">Output will appear here...</p>';
    });
  }
  
  if (runCodeBtn) {
    runCodeBtn.addEventListener("click", executeCode);
  }
  
  if (submitCodeBtn) {
    submitCodeBtn.addEventListener("click", submitCode);
  }

  // Navigation buttons (front-end only): cycle active problem
  nextQuestionBtn = document.getElementById('next-question-btn');
  prevQuestionBtn = document.getElementById('prev-question-btn');
  
  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener('click', function() {
      goToQuestion('next');
    });
  }
  
  if (prevQuestionBtn) {
    prevQuestionBtn.addEventListener('click', function() {
      goToQuestion('prev');
    });
  }
  
  // Initialize prev button state
  updateNavigationButtons(0);
  
  if (codeEditor) {
    // Keyboard shortcut: Ctrl+Enter to run code
    codeEditor.addEventListener("keydown", function(e) {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        executeCode();
      }
    });
  }
});

// Display output
function displayOutput(result) {
  if (!outputContent) {
    console.error("Output content element not found");
    return;
  }
  
  outputContent.innerHTML = ""; // Clear previous output
  
  // Status indicator
  const statusClass = result.status?.id === 3 ? "status-success" : "status-error";
  const statusText = result.status?.description || "Unknown";
  
  let outputHTML = `
    <div class="output-status ${statusClass}">
      <strong>Status:</strong> ${statusText}
      ${result.time ? `<span class="output-meta">Time: ${result.time}s</span>` : ""}
      ${result.memory ? `<span class="output-meta">Memory: ${result.memory}KB</span>` : ""}
    </div>
  `;
  
  // Standard output
  if (result.stdout) {
    outputHTML += `
      <div class="output-section">
        <div class="output-label">Output:</div>
        <pre class="output-text">${escapeHtml(result.stdout)}</pre>
      </div>
    `;
  }
  
  // Standard error
  if (result.stderr) {
    outputHTML += `
      <div class="output-section">
        <div class="output-label error-label">Error:</div>
        <pre class="output-text error-text">${escapeHtml(result.stderr)}</pre>
      </div>
    `;
  }
  
  // Compilation output
  if (result.compile_output) {
    outputHTML += `
      <div class="output-section">
        <div class="output-label error-label">Compilation Output:</div>
        <pre class="output-text error-text">${escapeHtml(result.compile_output)}</pre>
      </div>
    `;
  }
  
  // Message (if any)
  if (result.message) {
    outputHTML += `
      <div class="output-section">
        <div class="output-label">Message:</div>
        <pre class="output-text">${escapeHtml(result.message)}</pre>
      </div>
    `;
  }
  
  // If no output at all
  if (!result.stdout && !result.stderr && !result.compile_output && !result.message) {
    outputHTML += '<p class="output-placeholder">No output generated.</p>';
  }
  
  outputContent.innerHTML = outputHTML;
  // Save last execution result so submit can reference it
  try {
    lastExecutionResult = result || null;
  } catch (e) {
    lastExecutionResult = null;
  }
}

// Front-end: navigate between problems in the sidebar and update the statement header/placeholder
function goToQuestion(direction) {
  const listItems = document.querySelectorAll('.problem-list ul li');
  if (!listItems || listItems.length === 0) return;

  const items = Array.from(listItems);
  let activeIndex = items.findIndex(li => li.classList.contains('active'));
  if (activeIndex === -1) activeIndex = 0;
  
  let nextIndex;
  if (direction === 'next') {
    nextIndex = (activeIndex + 1) % items.length;
  } else {
    nextIndex = activeIndex - 1;
    if (nextIndex < 0) nextIndex = 0; // Stay on first question if trying to go previous
  }

  // Update active class
  items[activeIndex].classList.remove('active');
  items[nextIndex].classList.add('active');

  // Update problem statement header to match link text, and set placeholder content
  const anchor = items[nextIndex].querySelector('a');
  const titleText = anchor ? anchor.textContent.trim() : `Problem ${nextIndex + 1}`;

  const problemTitleEl = document.querySelector('.problem-statement h2');
  if (problemTitleEl) problemTitleEl.textContent = titleText;

  const tagEl = document.querySelector('.problem-statement .tag');
  if (tagEl) tagEl.style.display = 'none';

  // Replace statement content with a front-end placeholder (server should provide full content)
  const stmtEl = document.querySelector('.problem-statement');
  if (stmtEl) {
    // Keep the heading, clear the rest and show a small placeholder message
    const heading = stmtEl.querySelector('h2')?.outerHTML || `<h2>${titleText}</h2>`;
    stmtEl.innerHTML = heading + `<p style="margin-top:0.5rem;">Problem statement not loaded (front-end navigation only). Use the server to fetch full problem content.</p>`;
  }

  // Update navigation button states
  updateNavigationButtons(nextIndex);
}

// Update Previous/Next button states based on current question index
function updateNavigationButtons(currentIndex) {
  if (!prevQuestionBtn || !nextQuestionBtn) return;

  const listItems = document.querySelectorAll('.problem-list ul li');
  const totalQuestions = listItems.length;

  // Previous button: disabled on first question
  prevQuestionBtn.disabled = currentIndex === 0;
  
  // Next button: disabled on last question (optional, currently cycles)
  // nextQuestionBtn.disabled = currentIndex === totalQuestions - 1;
}

// Display error
function displayError(error) {
  if (!outputContent) {
    console.error("Output content element not found");
    return;
  }
  
  outputContent.innerHTML = `
    <div class="output-status status-error">
      <strong>Error:</strong> ${escapeHtml(error)}
    </div>
  `;
  // store error as last result so submit will include it as output
  lastExecutionResult = {
    stdout: "",
    stderr: String(error),
    compile_output: "",
    message: "",
    status: { id: 0, description: "Error" }
  };
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Execute code
async function executeCode() {
  if (!codeEditor || !languageSelect || !runCodeBtn || !submitCodeBtn || !outputContent) {
    console.error("DOM elements not initialized");
    return;
  }
  
  const code = codeEditor.value.trim();
  const language = languageSelect.value;
  
  if (!code) {
    displayError("Please enter some code to execute.");
    return;
  }
  
  // Disable buttons and show loading
  runCodeBtn.disabled = true;
  submitCodeBtn.disabled = true;
  runCodeBtn.textContent = "Running...";
  
  outputContent.innerHTML = '<p class="output-placeholder">Executing code...</p>';
  
  try {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: code,
        language: language,
        stdin: "" // Can be extended to accept user input
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      displayError(result.error || "Failed to execute code");
    } else {
      displayOutput(result);
    }
  } catch (error) {
    console.error("Error executing code:", error);
    displayError("Network error: " + error.message);
  } finally {
    // Re-enable buttons
    if (runCodeBtn && submitCodeBtn) {
      runCodeBtn.disabled = false;
      submitCodeBtn.disabled = false;
      runCodeBtn.textContent = "Run Code";
    }
  }
}

// Submit code (for now, same as run)
async function submitCode() {
  if (!codeEditor || !languageSelect || !runCodeBtn || !submitCodeBtn || !outputContent) {
    console.error("DOM elements not initialized");
    return;
  }
  
  // Submit should only send code + latest output (no execution)
  const code = codeEditor.value.trim();
  const language = languageSelect.value;

  if (!code) {
    displayError("Please enter some code to submit.");
    return;
  }

  // Determine output to send: prefer stdout, then stderr, compile_output, message
  let outputToStore = "";
  if (lastExecutionResult) {
    outputToStore = lastExecutionResult.stdout || lastExecutionResult.stderr || lastExecutionResult.compile_output || lastExecutionResult.message || "";
  }

  // Disable buttons and show loading
  runCodeBtn.disabled = true;
  submitCodeBtn.disabled = true;
  submitCodeBtn.textContent = "Submitting...";

  outputContent.innerHTML = '<p class="output-placeholder">Submitting code...</p>';

  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: code,
        language: language,
        output: outputToStore // may be blank string
      })
    });

    const result = await response.json();

    if (!response.ok) {
      displayError(result.error || "Failed to submit code");
    } else {
      // Keep the displayed output as-is; show a small success message
      outputContent.insertAdjacentHTML('afterbegin', `<div class="output-status status-success"><strong>Saved:</strong> Submission saved successfully</div>`);
      alert("Code submitted successfully!");
    }
  } catch (error) {
    console.error("Error submitting code:", error);
    displayError("Network error: " + error.message);
  } finally {
    // Re-enable buttons
    if (runCodeBtn && submitCodeBtn) {
      runCodeBtn.disabled = false;
      submitCodeBtn.disabled = false;
      submitCodeBtn.textContent = "Submit Solution";
    }
  }
}

// Event listeners are set up in DOMContentLoaded handler above

