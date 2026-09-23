import { harvestDOM } from "./harvester";
import { executeAction, setLastSSG } from "./executor";
import type { ScrimMessage } from "../lib/types";

chrome.runtime.onMessage.addListener((msg: ScrimMessage, _sender, sendResponse) => {
  if (msg.type === "harvest") {
    const ssg = harvestDOM();
    setLastSSG(ssg);
    sendResponse({ type: "harvest_result", ssg });
  } else if (msg.type === "execute") {
    const result = executeAction(msg.plan);
    sendResponse({ type: "execute_result", ...result });
  }
  return true; // async response
});
