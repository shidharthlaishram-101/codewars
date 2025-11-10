// Contest page JavaScript for code execution

// DOM elements (will be initialized on page load)
let codeEditor;
let languageSelect;
let runCodeBtn;
let submitCodeBtn;
let outputContent;
let clearOutputBtn;

// Language-specific code templates
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
  
  // For now, submit does the same as run
  // This can be extended later to save submissions to database
  const code = codeEditor.value.trim();
  const language = languageSelect.value;
  
  if (!code) {
    displayError("Please enter some code to submit.");
    return;
  }
  
  // Disable buttons and show loading
  runCodeBtn.disabled = true;
  submitCodeBtn.disabled = true;
  submitCodeBtn.textContent = "Submitting...";
  
  outputContent.innerHTML = '<p class="output-placeholder">Submitting code...</p>';
  
  try {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: code,
        language: language,
        stdin: ""
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      displayError(result.error || "Failed to submit code");
    } else {
      displayOutput(result);
      // TODO: Save submission to database
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

