// Search filter
const searchInput = document.getElementById("searchInput");
const rows = document.querySelectorAll("#participantTable tr");

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? "" : "none";
    });
  });
}

// Confirm delete
function confirmDelete() {
  return confirm("Are you sure you want to delete this participant?");
}

// ===================== PROBLEM MANAGEMENT =====================

let currentEditingProblemId = null;
let examplesData = [];
let constraintsData = [];
let snippetsData = [];

// Load all problems for admin
async function loadProblems() {
  try {
    const response = await fetch('/api/admin/problems', { credentials: 'include' });
    const data = await response.json();

    if (!response.ok) {
      showMessage('Error loading problems', 'error');
      return;
    }

    renderProblems(data.problems);
  } catch (error) {
    console.error('Error loading problems:', error);
    showMessage('Failed to load problems', 'error');
  }
}

// Render problems as cards
function renderProblems(problems) {
  const container = document.getElementById('problemsList');
  container.innerHTML = '';

  if (problems.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">No problems yet. Add one to get started!</p>';
    return;
  }

  problems.forEach(problem => {
    const card = document.createElement('div');
    card.className = 'problem-card';
    card.innerHTML = `
      <h3>${problem.title}</h3>
      <p><strong>Difficulty:</strong> <span style="text-transform:capitalize;">${problem.difficulty}</span></p>
      <p><strong>Order:</strong> ${problem.order}</p>
      <p><strong>Examples:</strong> ${problem.examples ? problem.examples.length : 0}</p>
      <p><strong>Constraints:</strong> ${problem.constraints ? problem.constraints.length : 0}</p>
      <div class="problem-card-actions">
        <button class="btn btn-primary" style="background-color:var(--primary-color);" onclick="openEditProblemModal('${problem.id}')">Edit</button>
        <button class="btn btn-danger" onclick="deleteProblem('${problem.id}')">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Show message
function showMessage(message, type = 'success') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = message;
  messageEl.className = `message ${type}`;
  setTimeout(() => {
    messageEl.className = 'message';
  }, 4000);
}

// Open add problem modal
function openAddProblemModal() {
  currentEditingProblemId = null;
  document.getElementById('modalTitle').textContent = 'Add New Problem';
  document.getElementById('problemForm').reset();
  examplesData = [];
  constraintsData = [];
  snippetsData = [];
  document.getElementById('examplesContainer').innerHTML = '';
  document.getElementById('constraintsContainer').innerHTML = '';
  document.getElementById('snippetsContainer').innerHTML = '';
  addExample();
  addConstraint();
  document.getElementById('problemModal').classList.add('active');
}

// Close modal
function closeProblemModal() {
  document.getElementById('problemModal').classList.remove('active');
  document.getElementById('problemForm').reset();
  examplesData = [];
  constraintsData = [];
  snippetsData = [];
}

// Open edit problem modal
async function openEditProblemModal(problemId) {
  try {
  const response = await fetch(`/api/admin/problems`, { credentials: 'include' });
  const data = await response.json();
    
    const problem = data.problems.find(p => p.id === problemId);
    if (!problem) {
      showMessage('Problem not found', 'error');
      return;
    }

    currentEditingProblemId = problemId;
    document.getElementById('modalTitle').textContent = 'Edit Problem';
    
    // Fill form
    document.getElementById('title').value = problem.title;
    document.getElementById('difficulty').value = problem.difficulty;
    document.getElementById('order').value = problem.order;
    document.getElementById('description').value = problem.description;
    document.getElementById('hasSubQuestions').checked = problem.hasSubQuestions || false;

    // Load examples
    examplesData = problem.examples || [];
    document.getElementById('examplesContainer').innerHTML = '';
    examplesData.forEach(example => renderExampleInput(example));
    if (examplesData.length === 0) addExample();

    // Load constraints
    constraintsData = problem.constraints || [];
    document.getElementById('constraintsContainer').innerHTML = '';
    constraintsData.forEach(constraint => renderConstraintInput(constraint));
    if (constraintsData.length === 0) addConstraint();

    // Load snippets
    await loadSnippetsForProblem(problemId);
    document.getElementById('snippetsContainer').innerHTML = '';
    snippetsData.forEach((snippet, index) => renderSnippetInput(snippet, index));

    document.getElementById('problemModal').classList.add('active');
  } catch (error) {
    console.error('Error loading problem:', error);
    showMessage('Failed to load problem', 'error');
  }
}

// Add example input
function addExample() {
  examplesData.push({ input: '', output: '', explanation: '' });
  renderExampleInput(examplesData[examplesData.length - 1], examplesData.length - 1);
}

// Render example input
function renderExampleInput(example, index) {
  if (index === undefined) index = examplesData.indexOf(example);
  
  const container = document.getElementById('examplesContainer');
  const div = document.createElement('div');
  div.className = 'array-item';
  div.style.flexDirection = 'column';
  div.style.marginBottom = '1rem';
  
  // Create inputs without using inline event handlers
  div.innerHTML = `
    <div style="margin-bottom:0.5rem;font-weight:bold;">Example ${index + 1}</div>
    <input type="text" class="example-input" data-index="${index}" placeholder="Input" value="${example.input || ''}">
    <input type="text" class="example-output" data-index="${index}" placeholder="Output" value="${example.output || ''}">
    <input type="text" class="example-explanation" data-index="${index}" placeholder="Explanation" value="${example.explanation || ''}">
    <button type="button" class="example-remove-btn" data-index="${index}">Remove</button>
  `;
  
  container.appendChild(div);
  
  // Add event listeners after creating the elements
  const inputField = div.querySelector('.example-input');
  const outputField = div.querySelector('.example-output');
  const explanationField = div.querySelector('.example-explanation');
  const removeBtn = div.querySelector('.example-remove-btn');
  
  if (inputField) {
    inputField.addEventListener('change', function() {
      examplesData[index].input = this.value;
    });
    inputField.addEventListener('input', function() {
      examplesData[index].input = this.value;
    });
  }
  
  if (outputField) {
    outputField.addEventListener('change', function() {
      examplesData[index].output = this.value;
    });
    outputField.addEventListener('input', function() {
      examplesData[index].output = this.value;
    });
  }
  
  if (explanationField) {
    explanationField.addEventListener('change', function() {
      examplesData[index].explanation = this.value;
    });
    explanationField.addEventListener('input', function() {
      examplesData[index].explanation = this.value;
    });
  }
  
  if (removeBtn) {
    removeBtn.addEventListener('click', function() {
      removeExample(index);
    });
  }
}

// Remove example
function removeExample(index) {
  examplesData.splice(index, 1);
  document.getElementById('examplesContainer').innerHTML = '';
  examplesData.forEach((example, idx) => renderExampleInput(example, idx));
}

// Add constraint input
function addConstraint() {
  constraintsData.push('');
  renderConstraintInput(constraintsData[constraintsData.length - 1], constraintsData.length - 1);
}

// Render constraint input
function renderConstraintInput(constraint, index) {
  if (index === undefined) index = constraintsData.indexOf(constraint);
  
  const container = document.getElementById('constraintsContainer');
  const div = document.createElement('div');
  div.className = 'array-item';
  
  div.innerHTML = `
    <input type="text" class="constraint-input" data-index="${index}" placeholder="Enter constraint" value="${constraint}">
    <button type="button" class="constraint-remove-btn" data-index="${index}">Remove</button>
  `;
  
  container.appendChild(div);
  
  // Add event listeners
  const inputField = div.querySelector('.constraint-input');
  const removeBtn = div.querySelector('.constraint-remove-btn');
  
  if (inputField) {
    inputField.addEventListener('change', function() {
      constraintsData[index] = this.value;
    });
    inputField.addEventListener('input', function() {
      constraintsData[index] = this.value;
    });
  }
  
  if (removeBtn) {
    removeBtn.addEventListener('click', function() {
      removeConstraint(index);
    });
  }
}

// Remove constraint
function removeConstraint(index) {
  constraintsData.splice(index, 1);
  document.getElementById('constraintsContainer').innerHTML = '';
  constraintsData.forEach((constraint, idx) => renderConstraintInput(constraint, idx));
}

// ===================== CODE SNIPPET FUNCTIONS =====================

// Load snippets for a problem
async function loadSnippetsForProblem(problemId) {
  try {
    const response = await fetch(`/api/admin/snippets/${problemId}`, { credentials: 'include' });
    const data = await response.json();
    snippetsData = data.snippets || [];
  } catch (error) {
    console.error('Error loading snippets:', error);
    snippetsData = [];
  }
}

// Add snippet input
function addSnippet() {
  snippetsData.push({ id: null, title: '', language: 'python', code: '', description: '', isNew: true });
  renderSnippetInput(snippetsData[snippetsData.length - 1], snippetsData.length - 1);
}

// Render snippet input
function renderSnippetInput(snippet, index) {
  const container = document.getElementById('snippetsContainer');
  const div = document.createElement('div');
  div.className = 'array-item';
  div.style.flexDirection = 'column';
  div.style.marginBottom = '1.5rem';
  div.style.backgroundColor = 'var(--bg-color)';
  div.style.padding = '1rem';
  div.style.borderRadius = '5px';
  
  div.innerHTML = `
    <div style="margin-bottom:0.5rem;font-weight:bold;">Code Snippet ${index + 1}</div>
    <input type="text" placeholder="Snippet Title (e.g., 'Starter Template')" value="${snippet.title || ''}" style="margin-bottom:0.5rem;" onchange="snippetsData[${index}].title = this.value">
    <select onchange="snippetsData[${index}].language = this.value" style="margin-bottom:0.5rem;">
      <option value="python" ${snippet.language === 'python' ? 'selected' : ''}>Python</option>
      <option value="java" ${snippet.language === 'java' ? 'selected' : ''}>Java</option>
      <option value="c" ${snippet.language === 'c' ? 'selected' : ''}>C</option>
      <option value="cpp" ${snippet.language === 'cpp' ? 'selected' : ''}>C++</option>
      <option value="javascript" ${snippet.language === 'javascript' ? 'selected' : ''}>JavaScript</option>
    </select>
    <textarea placeholder="Code snippet..." style="margin-bottom:0.5rem;font-family:monospace;min-height:120px;" onchange="snippetsData[${index}].code = this.value">${snippet.code || ''}</textarea>
    <input type="text" placeholder="Description (optional)" value="${snippet.description || ''}" style="margin-bottom:0.5rem;" onchange="snippetsData[${index}].description = this.value">
    ${snippet.id ? `<button type="button" style="background-color:var(--danger-color);" onclick="removeSnippet(${index})">Remove Snippet</button>` : '<button type="button" style="background-color:var(--danger-color);" onclick="removeNewSnippet(${index})">Remove</button>'}
  `;
  
  container.appendChild(div);
}

// Remove existing snippet
async function removeSnippet(index) {
  const snippet = snippetsData[index];
  if (snippet.id && confirm('Delete this snippet?')) {
    try {
      const response = await fetch(`/api/admin/snippets/${snippet.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        snippetsData.splice(index, 1);
        renderAllSnippets();
      } else {
        showMessage('Failed to delete snippet', 'error');
      }
    } catch (error) {
      console.error('Error deleting snippet:', error);
      showMessage('Failed to delete snippet', 'error');
    }
  }
}

// Remove new snippet (not yet saved)
function removeNewSnippet(index) {
  snippetsData.splice(index, 1);
  renderAllSnippets();
}

// Re-render all snippets
function renderAllSnippets() {
  document.getElementById('snippetsContainer').innerHTML = '';
  snippetsData.forEach((snippet, index) => renderSnippetInput(snippet, index));
}

// Save snippets when problem is saved
async function saveSnippetsForProblem(problemId) {
  for (const snippet of snippetsData) {
    try {
      // Only process valid snippets with code
      if (!snippet.code || !snippet.code.trim()) {
        console.log('Skipping empty snippet:', snippet);
        continue;
      }

      if (snippet.id) {
        // Update existing snippet
        const updateResponse = await fetch(`/api/admin/snippets/${snippet.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: snippet.title,
            language: snippet.language,
            code: snippet.code,
            description: snippet.description
          })
        });
        
        if (!updateResponse.ok) {
          const error = await updateResponse.json();
          console.error('Failed to update snippet:', error);
        } else {
          console.log('✅ Updated snippet:', snippet.id);
        }
      } else {
        // Create new snippet
        const createResponse = await fetch('/api/admin/snippets', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemId: problemId,
            title: snippet.title,
            language: snippet.language,
            code: snippet.code,
            description: snippet.description
          })
        });
        
        if (!createResponse.ok) {
          const error = await createResponse.json();
          console.error('Failed to create snippet:', error);
        } else {
          console.log('✅ Created snippet for problem:', problemId);
        }
      }
    } catch (error) {
      console.error('Error saving snippet:', error);
    }
  }
}

// ===================== PROBLEM SAVE HANDLER =====================

// Save problem (create or update)
document.getElementById('problemForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const problem = {
    title: document.getElementById('title').value,
    difficulty: document.getElementById('difficulty').value,
    order: document.getElementById('order').value,
    description: document.getElementById('description').value,
    examples: examplesData.filter(ex => ex.input && ex.output),
    constraints: constraintsData.filter(c => c.trim()),
    hasSubQuestions: document.getElementById('hasSubQuestions').checked
  };

  // Validate
  if (!problem.title || !problem.difficulty || !problem.order || !problem.description) {
    showMessage('Please fill all required fields', 'error');
    return;
  }

  try {
    let response;
    let problemId;

    if (currentEditingProblemId) {
      // Update
      response = await fetch(`/api/admin/problems/${currentEditingProblemId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(problem)
      });
      problemId = currentEditingProblemId;
    } else {
      // Create
      response = await fetch('/api/admin/problems', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(problem)
      });
    }

    const data = await response.json();
    console.log('Problem save response:', { status: response.status, data });
    
    if (currentEditingProblemId) {
      problemId = currentEditingProblemId;
    } else {
      problemId = data.id;
    }

    if (!response.ok) {
      console.error('API Error:', data);
      showMessage(data.error || 'Failed to save problem', 'error');
      return;
    }

    // Save code snippets
    if (problemId) {
      await saveSnippetsForProblem(problemId);
    }

    showMessage(data.message || 'Problem saved successfully', 'success');
    closeProblemModal();
    loadProblems();
  } catch (error) {
    console.error('Error saving problem:', error);
    showMessage('Failed to save problem', 'error');
  }
});

// Delete problem
async function deleteProblem(problemId) {
  if (!confirm('Are you sure you want to delete this problem?')) return;

  try {
    const response = await fetch(`/api/admin/problems/${problemId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || 'Failed to delete problem', 'error');
      return;
    }

    showMessage('Problem deleted successfully', 'success');
    loadProblems();
  } catch (error) {
    console.error('Error deleting problem:', error);
    showMessage('Failed to delete problem', 'error');
  }
}

// ===================== CHEATING RECORDS =====================

// Load all cheating records
async function loadCheatingRecords() {
  try {
    const container = document.getElementById('cheatingRecordsContainer');
    container.innerHTML = '<div class="loading">Loading cheating records...</div>';

    // Fetch all records and statistics
    const [recordsResponse, statsResponse] = await Promise.all([
      fetch('/api/admin/cheating-records', { credentials: 'include' }),
      fetch('/api/admin/cheating-statistics', { credentials: 'include' })
    ]);

    if (!recordsResponse.ok || !statsResponse.ok) {
      container.innerHTML = '<div class="no-records">Error loading cheating records</div>';
      return;
    }

    const recordsData = await recordsResponse.json();
    const statsData = await statsResponse.json();

    // Display summary statistics
    displayCheatingStatistics(statsData.statistics);

    // Filter records based on filter inputs
    let filteredRecords = recordsData.cheatingRecords || [];
    
    const teamCodeFilter = document.getElementById('filterTeamCode').value.toLowerCase();
    const emailFilter = document.getElementById('filterEmail').value.toLowerCase();
    const typeFilter = document.getElementById('filterCheatingType').value;

    if (teamCodeFilter) {
      filteredRecords = filteredRecords.filter(r => r.teamCode.toLowerCase().includes(teamCodeFilter));
    }
    if (emailFilter) {
      filteredRecords = filteredRecords.filter(r => r.email.toLowerCase().includes(emailFilter));
    }
    if (typeFilter) {
      filteredRecords = filteredRecords.filter(r => r.cheatingType === typeFilter);
    }

    // Display records in table
    displayCheatingRecordsTable(filteredRecords);
  } catch (error) {
    console.error('Error loading cheating records:', error);
    document.getElementById('cheatingRecordsContainer').innerHTML = '<div class="no-records">Error loading cheating records</div>';
  }
}

// Display statistics cards
function displayCheatingStatistics(statistics) {
  const summaryContainer = document.getElementById('cheatingSummary');
  summaryContainer.innerHTML = '';

  // Total incidents card
  const totalCard = document.createElement('div');
  totalCard.className = 'summary-card';
  totalCard.innerHTML = `
    <h3>Total Incidents</h3>
    <div class="value">${statistics.totalIncidents}</div>
  `;
  summaryContainer.appendChild(totalCard);

  // Breakdown by type
  const typeStats = statistics.incidentsByType;
  Object.entries(typeStats).forEach(([type, count]) => {
    const card = document.createElement('div');
    card.className = 'summary-card';
    const typeLabel = type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    card.innerHTML = `
      <h3>${typeLabel}</h3>
      <div class="value">${count}</div>
    `;
    summaryContainer.appendChild(card);
  });

  // Teams with most cheating
  if (statistics.teamsWithMostCheating && statistics.teamsWithMostCheating.length > 0) {
    const topTeam = statistics.teamsWithMostCheating[0];
    const card = document.createElement('div');
    card.className = 'summary-card';
    card.innerHTML = `
      <h3>Top Flagged Team</h3>
      <div class="value">${topTeam.teamCode}</div>
      <p style="color: var(--text-muted); margin-top: 0.5rem;">${topTeam.count} incidents</p>
    `;
    summaryContainer.appendChild(card);
  }
}

// Display cheating records in table format
function displayCheatingRecordsTable(records) {
  const container = document.getElementById('cheatingRecordsContainer');
  
  if (records.length === 0) {
    container.innerHTML = '<div class="no-records">No cheating records found.</div>';
    return;
  }

  let html = `
    <table class="cheating-table">
      <thead>
        <tr>
          <th>Team Code</th>
          <th>Email</th>
          <th>Cheating Type</th>
          <th>Timestamp</th>
          <th>Recorded At</th>
        </tr>
      </thead>
      <tbody>
  `;

  records.forEach(record => {
    const timestamp = new Date(record.timestamp).toLocaleString();
    const recordedAt = record.recordedAt ? new Date(record.recordedAt).toLocaleString() : 'N/A';
    const badgeClass = `badge-${record.cheatingType}`;
    const typeLabel = record.cheatingType.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    html += `
      <tr>
        <td><strong>${record.teamCode}</strong></td>
        <td>${record.email}</td>
        <td><span class="cheating-type-badge ${badgeClass}">${typeLabel}</span></td>
        <td>${timestamp}</td>
        <td>${recordedAt}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

// Add event listeners for filter inputs
document.addEventListener('DOMContentLoaded', function() {
  const filterInputs = ['filterTeamCode', 'filterEmail', 'filterCheatingType'];
  
  filterInputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', loadCheatingRecords);
      element.addEventListener('change', loadCheatingRecords);
    }
  });
});
