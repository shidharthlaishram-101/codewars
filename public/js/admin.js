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
  document.getElementById('examplesContainer').innerHTML = '';
  document.getElementById('constraintsContainer').innerHTML = '';
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
  
  div.innerHTML = `
    <div style="margin-bottom:0.5rem;font-weight:bold;">Example ${index + 1}</div>
    <input type="text" placeholder="Input" value="${example.input || ''}" onchange="examplesData[${index}].input = this.value">
    <input type="text" placeholder="Output" value="${example.output || ''}" onchange="examplesData[${index}].output = this.value">
    <input type="text" placeholder="Explanation" value="${example.explanation || ''}" onchange="examplesData[${index}].explanation = this.value">
    <button type="button" onclick="removeExample(${index})">Remove</button>
  `;
  
  container.appendChild(div);
}

// Remove example
function removeExample(index) {
  examplesData.splice(index, 1);
  document.getElementById('examplesContainer').innerHTML = '';
  examplesData.forEach(example => renderExampleInput(example));
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
    <input type="text" placeholder="Enter constraint" value="${constraint}" onchange="constraintsData[${index}] = this.value">
    <button type="button" onclick="removeConstraint(${index})">Remove</button>
  `;
  
  container.appendChild(div);
}

// Remove constraint
function removeConstraint(index) {
  constraintsData.splice(index, 1);
  document.getElementById('constraintsContainer').innerHTML = '';
  constraintsData.forEach(constraint => renderConstraintInput(constraint));
}

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
    if (currentEditingProblemId) {
      // Update
      response = await fetch(`/api/admin/problems/${currentEditingProblemId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(problem)
      });
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

    if (!response.ok) {
      showMessage(data.error || 'Failed to save problem', 'error');
      return;
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
