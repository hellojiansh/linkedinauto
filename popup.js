document.getElementById("start").addEventListener("click", async () => {
  const email = document.getElementById("email")?.value?.trim();

  try {
    const response = await chrome.runtime.sendMessage({
      type: "START_BRANDSTORM_FLOW",
      email: email || undefined
    });

    // Debug: right click the extension icon -> Inspect popup.
    console.log("Brandstorm flow response:", response);
  } catch (err) {
    console.error("Brandstorm flow error:", err);
  }

  window.close();
});
