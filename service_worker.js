const BRANDSTORM_LANDING_URL = "https://brandstorm.loreal.com/en";
const BRANDSTORM_SIGNUP_URL =
  "https://brandstorm.loreal.com/en/users/sign_up?onboarding=email&redirect_to=%2Fen%2Fchallenges%2Findia%3Fparticipate_modal%3Dtrue&step=email";
const BRANDSTORM_ORIGIN = "https://brandstorm.loreal.com";

function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    const listener = (updatedTabId, info) => {
      if (updatedTabId !== tabId) return;
      if (info.status !== "complete") return;
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function clearBrandstormCookies() {
  await chrome.browsingData.remove(
    {
      origins: [BRANDSTORM_ORIGIN]
    },
    {
      cookies: true
    }
  );
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "START_BRANDSTORM_FLOW") return;

  (async () => {
    const tab = await chrome.tabs.create({ url: BRANDSTORM_LANDING_URL });

    await waitForTabComplete(tab.id);
    await clearBrandstormCookies();

    await chrome.tabs.update(tab.id, { url: BRANDSTORM_SIGNUP_URL });

    sendResponse({ ok: true });
  })();

  return true;
});
