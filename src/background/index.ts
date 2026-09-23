import type { SSG, ActionPlan, ScrimMessage } from "../lib/types";

const SERVER_URL = "http://localhost:8000";

async function getActiveTaId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");
  return tab.id;
}

async function harvestSSG(tabId: number): Promise<SSG> {
  const response = await chrome.tabs.sendMessage(tabId, { type: "harvest" } as ScrimMessage);
  return response.ssg;
}

async function getPlan(task: string, ssg: SSG): Promise<ActionPlan> {
  const res = await fetch(`${SERVER_URL}/agent/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, ssg }),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function executeAction(tabId: number, plan: ActionPlan): Promise<{ success: boolean; error?: string }> {
  return chrome.tabs.sendMessage(tabId, { type: "execute", plan } as ScrimMessage);
}

chrome.runtime.onMessage.addListener((msg: ScrimMessage, _sender, sendResponse) => {
  if (msg.type === "run_task") {
    (async () => {
      try {
        const tabId = await getActiveTaId();
        const ssg = await harvestSSG(tabId);
        console.log(`[scrim] Harvested ${ssg.nodes.length} nodes from ${ssg.url}`);
        const plan = await getPlan(msg.task, ssg);
        console.log(`[scrim] Plan: ${plan.action.type} → ${plan.action.target}`, plan.reasoning);
        const result = await executeAction(tabId, plan);
        sendResponse({ success: result.success, plan, error: result.error });
      } catch (e: any) {
        console.error("[scrim]", e);
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }
});
