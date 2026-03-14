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

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function fillRandomNames(tabId) {
  const firstNames = [
    "Aarav",
    "Vivaan",
    "Aditya",
    "Arjun",
    "Ishaan",
    "Kabir",
    "Riya",
    "Anaya",
    "Diya",
    "Aisha",
    "Meera",
    "Saanvi"
  ];

  const lastNames = [
    "Sharma",
    "Verma",
    "Gupta",
    "Mehta",
    "Kapoor",
    "Malhotra",
    "Iyer",
    "Nair",
    "Reddy",
    "Patel",
    "Singh",
    "Khan"
  ];

  const firstName = pickRandom(firstNames);
  const lastName = pickRandom(lastNames);

  await chrome.scripting.executeScript({
    target: { tabId },
    args: [firstName, lastName],
    func: (fn, ln) => {
      const setValue = (el, value) => {
        el.focus();
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.blur();
      };

      const first = document.querySelector("#user_first_name");
      const last = document.querySelector("#user_last_name");

      if (first) setValue(first, fn);
      if (last) setValue(last, ln);

      return {
        filled: Boolean(first && last),
        foundFirst: Boolean(first),
        foundLast: Boolean(last)
      };
    }
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "START_BRANDSTORM_FLOW") return;

  (async () => {
    const tab = await chrome.tabs.create({ url: BRANDSTORM_LANDING_URL });

    await waitForTabComplete(tab.id);
    await clearBrandstormCookies();

    await chrome.tabs.update(tab.id, { url: BRANDSTORM_SIGNUP_URL });
    await waitForTabComplete(tab.id);
    await fillRandomNames(tab.id);

    sendResponse({ ok: true });
  })();

  return true;
});
