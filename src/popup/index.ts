const taskInput = document.getElementById("task") as HTMLInputElement;
const runButton = document.getElementById("run") as HTMLButtonElement;
const statusDiv = document.getElementById("status") as HTMLDivElement;
const connLabel = document.getElementById("conn-label") as HTMLSpanElement;

function setStatus(text: string, label = "Ready") {
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
      setStatus(`${response.plan.action.type} → ${response.plan.action.target || "done"}\n${response.plan.reasoning}`, "Done");
    } else {
      setStatus(response.error, "Failed");
    }
  } catch (e: any) {
    setStatus(e.message, "Error");
  } finally {
    runButton.disabled = false;
  }
});

taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runButton.click();
});
