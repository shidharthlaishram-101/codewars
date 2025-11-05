document.getElementById("loadMessage").addEventListener("click", async () => {
  const res = await fetch("/api/message");
  const data = await res.json();
  document.getElementById("output").textContent = data.message;
});
