import { useEffect, useState } from 'react';
import { YoursEventName } from '../inject';
import { QueueTrackerMessage } from './useQueueTracker';

export type BlockHeightTrackerMessage = {
  action: YoursEventName.BLOCK_HEIGHT_UPDATE;
  data: { currentHeight: number; lastHeight: number; syncing?: boolean };
};

// Revert: remove hasWalletOrAccount param, always show sync overlay if syncing, percentCompleted < 100, or queueLength > 0
export const useBlockHeightTracker = () => {
  const [percentCompleted, setPercentageComplete] = useState(0);
  const [showSyncPage, setShowSyncPage] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleBlockHeightUpdate = (event: CustomEvent<BlockHeightTrackerMessage>) => {
      const message = event.detail;
      if (message.action === YoursEventName.BLOCK_HEIGHT_UPDATE) {
        const { currentHeight, lastHeight } = message.data;
        let percent = 0;
        if (
          typeof currentHeight === 'number' && currentHeight > 0 &&
          typeof lastHeight === 'number' && lastHeight > 0
        ) {
          percent = Math.round((lastHeight / currentHeight) * 100);
          if (percent > 100) percent = 100;
        } else if (lastHeight === currentHeight && currentHeight > 0) {
          percent = 100;
        }
        setPercentageComplete(percent);
        setSyncing(!!message.data.syncing);
      }
    };
    const handleQueueStatusUpdate = (event: CustomEvent<QueueTrackerMessage>) => {
      const message = event.detail;
      if (message.action === YoursEventName.QUEUE_STATUS_UPDATE) {
        setQueueLength(message.data.length || 0);
      }
    };
    window.addEventListener('yours-wallet-message', handleBlockHeightUpdate as EventListener);
    window.addEventListener('yours-wallet-message', handleQueueStatusUpdate as EventListener);
    return () => {
      window.removeEventListener('yours-wallet-message', handleBlockHeightUpdate as EventListener);
      window.removeEventListener('yours-wallet-message', handleQueueStatusUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    setShowSyncPage(syncing || percentCompleted < 100 || queueLength > 0);
  }, [syncing, percentCompleted, queueLength]);

  return { percentCompleted, showSyncPage };
};
