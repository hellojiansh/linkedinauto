document.getElementById("start").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "START_BRANDSTORM_FLOW" });
  window.close();
});
