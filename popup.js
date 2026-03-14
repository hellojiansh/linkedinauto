const BRANDSTORM_URL = "https://brandstorm.loreal.com/en";

document.getElementById("start").addEventListener("click", async () => {
  await chrome.tabs.create({ url: BRANDSTORM_URL });
  window.close();
});
