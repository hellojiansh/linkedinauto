# Brandstorm Opener (Chrome Extension)

This repo contains a minimal Manifest V3 browser extension.

## What it does

- Adds an extension popup with a **Start** button
- Clicking **Start**:
  1. Opens `https://brandstorm.loreal.com/en`
  2. Clears cookies for `https://brandstorm.loreal.com`
  3. Navigates the same tab to:
     `https://brandstorm.loreal.com/en/users/sign_up?onboarding=email&redirect_to=%2Fen%2Fchallenges%2Findia%3Fparticipate_modal%3Dtrue&step=email`

## Install (Chrome / Edge)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder (the repo root)
5. Click the extension icon → **Start**

## Notes

- Cookie clearing is implemented via the `browsingData` permission in `service_worker.js`.
