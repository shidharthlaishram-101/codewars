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
 let prevQuestionBtn;
 // Store problems data
 let problemsData = [];
 let currentProblemIndex = 0;
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

// Fetch problems from Firebase API
async function loadProblems() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const difficulty = urlParams.get('difficulty') || 'easy';
    
    const response = await fetch(`/api/problems?difficulty=${difficulty}`);
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Error loading problems:", data.error);
      showProblemError("Failed to load problems. Please refresh the page.");
      return false;
    }
    
    if (!data.problems || data.problems.length === 0) {
      console.warn("⚠️ No problems found for difficulty:", difficulty);
      showProblemError("No problems found for this difficulty level.");
      return false;
    }
    
    problemsData = data.problems;
    console.log(`✅ Loaded ${problemsData.length} problems for difficulty: ${difficulty}`);
    
    // Render problem list and display first problem
    renderProblemList();
    displayProblem(0);
    
    return true;
  } catch (error) {
    console.error("❌ Error fetching problems:", error);
    showProblemError("Network error loading problems.");
    return false;
  }
}

// Render problems in the sidebar list
function renderProblemList() {
  const problemListEl = document.getElementById('problem-list');
  if (!problemListEl) return;
  
  problemListEl.innerHTML = '';
  
  problemsData.forEach((problem, index) => {
    const li = document.createElement('li');
    if (index === 0) li.classList.add('active');
    
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = problem.title || `Problem ${index + 1}`;
    a.addEventListener('click', function(e) {
      e.preventDefault();
      goToQuestion(index);
    });
    
    li.appendChild(a);
    problemListEl.appendChild(li);
  });
}

// Display problem statement
function displayProblem(index) {
  if (index < 0 || index >= problemsData.length) return;
  
  currentProblemIndex = index;
  const problem = problemsData[index];
  const problemStatementEl = document.getElementById('problem-statement');
  
  if (!problemStatementEl) return;
  
  // Build HTML for problem statement
  let html = `<h2>${problem.title || `Problem ${index + 1}`}</h2>`;
  
  if (problem.difficulty) {
    html += `<span class="tag">${problem.difficulty}</span>`;
  }
  
  if (problem.description) {
    html += `<p>${problem.description}</p>`;
  }
  
  if (problem.examples && Array.isArray(problem.examples)) {
    problem.examples.forEach((example, i) => {
      html += `<h3>Example ${i + 1}:</h3>`;
      html += `<pre><strong>Input:</strong> ${escapeHtml(example.input || '')}\n<strong>Output:</strong> ${escapeHtml(example.output || '')}</pre>`;
      if (example.explanation) {
        html += `<p><strong>Explanation:</strong> ${example.explanation}</p>`;
      }
    });
  }
  
  if (problem.constraints && Array.isArray(problem.constraints)) {
    html += `<h3>Constraints:</h3><ul>`;
    problem.constraints.forEach(constraint => {
      html += `<li><code>${constraint}</code></li>`;
    });
    html += `</ul>`;
  }
  
  problemStatementEl.innerHTML = html;
  
  // Update navigation buttons
  updateNavigationButtons(index);
}

// Show error in problem area
function showProblemError(message) {
  const problemListEl = document.getElementById('problem-list');
  if (problemListEl) {
    problemListEl.innerHTML = `<li><a href="#">Error: ${message}</a></li>`;
  }
  
  const problemStatementEl = document.getElementById('problem-statement');
  if (problemStatementEl) {
    problemStatementEl.innerHTML = `<h2>Error</h2><p>${message}</p>`;
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", async function() {
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
      if (currentProblemIndex < problemsData.length - 1) {
        displayProblem(currentProblemIndex + 1);
      }
    });
  }
  
  if (prevQuestionBtn) {
    prevQuestionBtn.addEventListener('click', function() {
      if (currentProblemIndex > 0) {
        displayProblem(currentProblemIndex - 1);
      }
    });
  }
  
  // Load problems from Firebase
  await loadProblems();
  
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

// Update Previous/Next button states based on current question index
function updateNavigationButtons(currentIndex) {
  if (!prevQuestionBtn || !nextQuestionBtn) return;

  // Previous button: disabled on first question
  prevQuestionBtn.disabled = currentIndex === 0;
  
  // Next button: disabled on last question
  nextQuestionBtn.disabled = currentIndex === problemsData.length - 1;
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

