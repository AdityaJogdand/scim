// src/background/index.ts
var SERVER_URL = "http://localhost:8000";
async function getActiveTaId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");
  return tab.id;
}
async function harvestSSG(tabId) {
  const response = await chrome.tabs.sendMessage(tabId, { type: "harvest" });
  return response.ssg;
}
async function getPlan(task, ssg) {
  const res = await fetch(`${SERVER_URL}/agent/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, ssg })
  });
  if (!res.ok) throw new Error(`Server error: ${res.status} ${await res.text()}`);
  return res.json();
}
async function executeAction(tabId, plan) {
  return chrome.tabs.sendMessage(tabId, { type: "execute", plan });
}
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "run_task") {
    (async () => {
      try {
        const tabId = await getActiveTaId();
        const ssg = await harvestSSG(tabId);
        console.log(`[scrim] Harvested ${ssg.nodes.length} nodes from ${ssg.url}`);
        const plan = await getPlan(msg.task, ssg);
        console.log(`[scrim] Plan: ${plan.action.type} \u2192 ${plan.action.target}`, plan.reasoning);
        const result = await executeAction(tabId, plan);
        sendResponse({ success: result.success, plan, error: result.error });
      } catch (e) {
        console.error("[scrim]", e);
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }
});
