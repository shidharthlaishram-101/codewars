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
