![Example Image](/public/banner.png)

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

# Yours Wallet | Non-Custodial Web3 SPV Wallet For BSV

Yours Wallet is an open-source and non-custodial web3 SPV wallet for Bitcoin SV (BSV) and [1Sat Ordinals](https://docs.1satordinals.com/). This wallet allows users to have full control over their funds, providing security and independence in managing their assets.

## Features

- 🔑 **Non-Custodial:** Your private keys are encrypted and stored locally on your device, ensuring complete control over your funds.
- 🙌 **Multi-Account:** Use one wallet to manage all of your different accounts/keys.
- 😎 **User-Friendly:** A user-friendly interface makes asset management a breeze.
- ✅ **BSV Support:** Receive and Send BSV payments.
- 🟡 **1Sat Ordinals:** Full support for sending and transferring 1Sat Ordinals.
- 🔐 **Secure:** Open Source and audited by the community.


## License

Yours Wallet is released under the [MIT License](https://opensource.org/licenses/MIT)

## Integrating Yours Wallet: Quick Start for Web Apps

This guide shows you, step by step, how to connect your web app to Yours Wallet, keep users connected, disconnect, and show their balance—just like in `test-connect.html`. No browser extension is needed. Yours Wallet injects a `window.yourswallet` object into your page.

### 1. Check if Yours Wallet is Available

Add this check before you do anything else:

```js
if (!window.yourswallet) {
  alert('Yours Wallet is not available on this page.');
}
```

### 2. Connect to the Wallet (Get User Address)

Call this function when the user clicks "Connect":

```js
async function connectWallet() {
  if (!window.yourswallet) return;
  try {
    const result = await window.yourswallet.request('getAddress');
    const address = result.address;
    localStorage.setItem('yoursWalletAddress', address); // Save for later
    showConnected(address);
  } catch (e) {
    alert('Could not connect: ' + e.message);
  }
}
```

### 3. Keep Users Connected (Session Persistence)

When your page loads, check if the user is already connected:

```js
function restoreConnection() {
  const address = localStorage.getItem('yoursWalletAddress');
  if (address) {
    showConnected(address);
  } else {
    showDisconnected();
  }
}

document.addEventListener('DOMContentLoaded', restoreConnection);
```

### 4. Disconnect the Wallet

Let users disconnect with a button:

```js
function disconnectWallet() {
  localStorage.removeItem('yoursWalletAddress');
  showDisconnected();
}
```

### 5. Show the User's Balance

Call this after connecting, or when the user clicks "Get Balance":

```js
async function getBalance(address) {
  if (!window.yourswallet) return;
  try {
    const result = await window.yourswallet.request('getBalance', { address });
    showBalance(result.balance);
  } catch (e) {
    alert('Could not get balance: ' + e.message);
  }
}
```

### 6. Example: Putting It All Together

Here's a simple way to wire up your buttons and UI:

```js
window.addEventListener('DOMContentLoaded', () => {
  const connectBtn = document.getElementById('connectBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const balanceBtn = document.getElementById('balanceBtn');

  restoreConnection();

  connectBtn.onclick = connectWallet;
  disconnectBtn.onclick = disconnectWallet;
  balanceBtn.onclick = () => {
    const address = localStorage.getItem('yoursWalletAddress');
    if (address) getBalance(address);
  };
});
```

### 7. UI Tips
- Show the Connect button only if not connected.
- Show Disconnect and Get Balance only if connected.
- Display the user's address and balance clearly.
- Use functions like `showConnected(address)`, `showDisconnected()`, and `showBalance(balance)` to update your UI.

### 8. Best Practices
- Always check for `window.yourswallet` before using it.
- Use `localStorage` to remember the connection.
- Handle errors with alerts or messages.
- Wrap your code in `DOMContentLoaded` so your elements are ready.



