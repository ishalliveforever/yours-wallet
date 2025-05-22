import { useCallback, useEffect, useRef, useState } from 'react';

// Types for connection request and response
export type WalletConnectRequest = {
  type: 'CONNECT_REQUEST';
  origin: string;
  id: string; // unique id for the request
};

export type WalletConnectResponse = {
  type: 'CONNECT_RESPONSE';
  id: string;
  approved: boolean;
  address?: string;
  reason?: string;
};

// Hook for handling wallet connect messaging
export function useWalletConnectMessaging(address: string | undefined) {
  const [pendingRequest, setPendingRequest] = useState<WalletConnectRequest | null>(null);
  const requestSourceRef = useRef<Window | null>(null);

  // Listen for postMessage events
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const { data } = event;
      if (
        data &&
        typeof data === 'object' &&
        data.type === 'CONNECT_REQUEST' &&
        typeof data.id === 'string' &&
        typeof data.origin === 'string'
      ) {
        setPendingRequest({
          type: 'CONNECT_REQUEST',
          origin: data.origin,
          id: data.id,
        });
        requestSourceRef.current = event.source as Window;
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Approve connection
  const approve = useCallback(() => {
    if (pendingRequest && requestSourceRef.current && address) {
      const response: WalletConnectResponse = {
        type: 'CONNECT_RESPONSE',
        id: pendingRequest.id,
        approved: true,
        address,
      };
      requestSourceRef.current.postMessage(response, '*');
      setPendingRequest(null);
      requestSourceRef.current = null;
    }
  }, [pendingRequest, address]);

  // Deny connection
  const deny = useCallback((reason?: string) => {
    if (pendingRequest && requestSourceRef.current) {
      const response: WalletConnectResponse = {
        type: 'CONNECT_RESPONSE',
        id: pendingRequest.id,
        approved: false,
        reason: reason || 'User denied connection',
      };
      requestSourceRef.current.postMessage(response, '*');
      setPendingRequest(null);
      requestSourceRef.current = null;
    }
  }, [pendingRequest]);

  return { pendingRequest, approve, deny };
}
