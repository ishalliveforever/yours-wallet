import { HOSTED_YOURS_IMAGE } from './constants';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const sendMessage = (message: any) => {
  console.log('[sendMessage] Dispatching yours-wallet-message:', message);
  window.dispatchEvent(new CustomEvent('yours-wallet-message', { detail: message }));
};

export const sendTransactionNotification = (newTxCount: number) => {
  // Use the Web Notifications API for web/mobile
  if (window.Notification && Notification.permission === 'granted') {
    new Notification('New Transactions', {
      body: `Your SPV wallet has received ${newTxCount} new transaction${newTxCount > 1 ? 's' : ''}!`,
      icon: HOSTED_YOURS_IMAGE,
    });
  } else if (window.Notification && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification('New Transactions', {
          body: `Your SPV wallet has received ${newTxCount} new transaction${newTxCount > 1 ? 's' : ''}!`,
          icon: HOSTED_YOURS_IMAGE,
        });
      }
    });
  }
};
