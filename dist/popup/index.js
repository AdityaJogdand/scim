// src/popup/index.ts
var taskInput = document.getElementById("task");
var runButton = document.getElementById("run");
var statusDiv = document.getElementById("status");
var connLabel = document.getElementById("conn-label");
function setStatus(text, label = "Ready") {
  statusDiv.textContent = text;
  connLabel.textContent = label;
}
runButton.addEventListener("click", async () => {
  const task = taskInput.value.trim();
  if (!task) return;
  runButton.disabled = true;
  setStatus("Harvesting page...", "Running");
  try {
    const response = await chrome.runtime.sendMessage({ type: "run_task", task });
    if (response.success) {
      setStatus(`${response.plan.action.type} \u2192 ${response.plan.action.target || "done"}
${response.plan.reasoning}`, "Done");
    } else {
      setStatus(response.error, "Failed");
    }
  } catch (e) {
    setStatus(e.message, "Error");
  } finally {
    runButton.disabled = false;
  }
});
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runButton.click();
});
