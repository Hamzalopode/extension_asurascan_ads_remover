# AsuraScan Popup Clicker Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description

This Chrome extension automatically clicks the "Skip Ad" button or closes the annoying premium/promotional popups and banners that appear on AsuraComic.net, allowing for a smoother reading experience.

It features a simple popup interface to toggle the blocker ON or OFF, view the current status, and see how many popups ("Demon Lords"!) have been dismissed.

<!-- Optional: Add a screenshot/GIF here -->
<!-- ![Extension Popup Screenshot](path/to/screenshot.png) -->

## Features

*   **Automatic Dismissal**: Intelligently detects and clicks close/skip buttons on various popups and banners specific to AsuraComic.net.
*   **Popup UI**: Click the extension icon to access:
    *   **Toggle Switch**: Easily turn the blocker ON or OFF.
    *   **Status Indicator**: Clear visual cue (ON/OFF badge) showing if the blocker is active.
    *   **Block Counter**: Tracks the number of popups/banners dismissed (counted as "Demon Lords Blocked").
    *   **Support Link**: A small button to support the developer via PayPal.
    *   **Animated Character**: A subtle, animated Lloyd face appears randomly in the background for fun!
*   **Persistent State**: Remembers your ON/OFF preference and the block count across browser sessions.
*   **Icon Badge**: The extension icon displays "ON" or "OFF" text for at-a-glance status.

## Target Website

*   `asuracomic.net`

## Installation

Since this extension is not (yet) on the Chrome Web Store, you need to load it manually:

1.  Download or clone this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" using the toggle switch in the top-right corner.
4.  Click the "Load unpacked" button that appears.
5.  Select the directory where you downloaded/cloned the extension files.
6.  The "AsuraScan Popup Clicker" extension should now appear in your list of extensions and be active.

## Usage

1.  Navigate to `asuracomic.net`.
2.  Click the AsuraScan Popup Clicker icon in your Chrome toolbar to open the popup.
3.  Use the "Toggle ON/OFF" button to enable or disable the popup blocking.
    *   When **ON**, the extension will actively look for popups/banners and attempt to close them.
    *   When **OFF**, the extension will do nothing.
4.  The status and the count of blocked items are displayed in the popup.

## Support the Developer

If you find this extension helpful, consider supporting the developer via the donation link in the popup!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
