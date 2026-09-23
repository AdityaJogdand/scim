const taskInput = document.getElementById("task") as HTMLInputElement;
const runButton = document.getElementById("run") as HTMLButtonElement;
const statusDiv = document.getElementById("status") as HTMLDivElement;

function setStatus(text: string) {
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
      setStatus(`Done: ${response.plan.action.type} → ${response.plan.action.target || "n/a"}\n${response.plan.reasoning}`);
    } else {
      setStatus(`Error: ${response.error}`);
    }
  } catch (e: any) {
    setStatus(`Error: ${e.message}`);
  } finally {
    runButton.disabled = false;
  }
});

taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runButton.click();
});
