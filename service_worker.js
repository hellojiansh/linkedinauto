const BRANDSTORM_LANDING_URL = "https://brandstorm.loreal.com/en";
const BRANDSTORM_SIGNUP_URL =
  "https://brandstorm.loreal.com/en/users/sign_up?onboarding=email&redirect_to=%2Fen%2Fchallenges%2Findia%3Fparticipate_modal%3Dtrue&step=email";
const BRANDSTORM_ORIGIN = "https://brandstorm.loreal.com";

async function waitForTabComplete(tabId, timeoutMs = 45000) {
  // Fast-path: avoid a race where the tab is already complete before we attach the listener.
  const existing = await chrome.tabs.get(tabId);
  if (existing?.status === "complete") return;

  return new Promise((resolve, reject) => {
    const listener = (updatedTabId, info) => {
      if (updatedTabId !== tabId) return;
      if (info.status !== "complete") return;
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };

    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error(`Timed out waiting for tab ${tabId} to complete`));
    }, timeoutMs);

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

async function fillRandomNames(tabId, email) {
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

  // Some sites hydrate/replace the input nodes after `tabs.onUpdated` reports
  // `complete`. We retry and only consider it filled once the value "sticks".
  const injectionResults = await chrome.scripting.executeScript({
    target: { tabId },
    args: [firstName, lastName, email],
    func: async (fn, ln, userEmail) => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      const setValue = (el, value) => {
        const proto = window.HTMLInputElement?.prototype;
        const setter = proto
          ? Object.getOwnPropertyDescriptor(proto, "value")?.set
          : null;

        el.focus();
        if (setter) setter.call(el, value);
        else el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        el.blur();
      };

      const fillInput = async (selector, value, timeoutMs) => {
        if (!value) return { selector, ok: false, skipped: true };

        const deadline = Date.now() + timeoutMs;
        let attempts = 0;

        while (Date.now() < deadline) {
          attempts += 1;
          const el = document.querySelector(selector);

          if (
            el &&
            (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
          ) {
            setValue(el, value);

            await sleep(150);
            if (el.value === value) {
              await sleep(800);
              if (el.isConnected && el.value === value) {
                return { selector, ok: true, attempts, finalValue: el.value };
              }
            }
          }

          await sleep(150);
        }

        const lastEl = document.querySelector(selector);
        return {
          selector,
          ok: false,
          attempts,
          found: Boolean(lastEl),
          lastValue:
            lastEl &&
            (lastEl instanceof HTMLInputElement ||
              lastEl instanceof HTMLTextAreaElement)
              ? lastEl.value
              : undefined
        };
      };

      const [first, last, emailRes] = await Promise.all([
        fillInput("#user_first_name", fn, 15000),
        fillInput("#user_last_name", ln, 15000),
        fillInput("#user_email", userEmail, 15000)
      ]);

      return {
        first,
        last,
        email: emailRes,
        filledFirstLast: Boolean(first.ok && last.ok),
        filledEmail: Boolean(emailRes.ok)
      };
    }
  });

  const topFrame =
    injectionResults.find((r) => r.frameId === 0) || injectionResults[0];
  const result =
    topFrame?.result && typeof topFrame.result === "object" ? topFrame.result : {};

  return {
    firstName,
    lastName,
    providedEmail: email || undefined,
    ...result
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "START_BRANDSTORM_FLOW") return;

  (async () => {
    try {
      const tab = await chrome.tabs.create({ url: BRANDSTORM_LANDING_URL });
      const email =
        typeof message?.email === "string" ? message.email.trim() : "";

      await waitForTabComplete(tab.id);
      await clearBrandstormCookies();

      await chrome.tabs.update(tab.id, { url: BRANDSTORM_SIGNUP_URL });
      await waitForTabComplete(tab.id);

      const fillResult = await fillRandomNames(tab.id, email);
      console.log("Brandstorm fill result:", fillResult);

      sendResponse({ ok: true, fillResult });
    } catch (err) {
      console.error("Brandstorm flow failed:", err);
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  })();

  return true;
});
