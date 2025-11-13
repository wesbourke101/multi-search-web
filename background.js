async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function canInject(url) {
  if (!url) return false;
  if (url.startsWith("chrome://")) return false;
  if (url.startsWith("edge://")) return false;
  if (url.startsWith("about:")) return false;
  if (url.startsWith("chrome-extension://")) return false;
  if (url.includes("chrome.google.com/webstore")) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://");
}

async function toggle() {
  const tab = await getActiveTab();
  if (!tab || !canInject(tab.url || "")) return;
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-window") {
    await toggle();
  }
});
