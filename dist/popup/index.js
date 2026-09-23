// src/popup/index.ts
var taskInput = document.getElementById("task");
var runButton = document.getElementById("run");
var statusDiv = document.getElementById("status");
function setStatus(text) {
  statusDiv.textContent = text;
}
runButton.addEventListener("click", async () => {
  const task = taskInput.value.trim();
  if (!task) return;
  runButton.disabled = true;
  setStatus("Harvesting page...");
  try {
    const response = await chrome.runtime.sendMessage({ type: "run_task", task });
    if (response.success) {
      setStatus(`Done: ${response.plan.action.type} \u2192 ${response.plan.action.target || "n/a"}
${response.plan.reasoning}`);
    } else {
      setStatus(`Error: ${response.error}`);
    }
  } catch (e) {
    setStatus(`Error: ${e.message}`);
  } finally {
    runButton.disabled = false;
  }
});
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runButton.click();
});
