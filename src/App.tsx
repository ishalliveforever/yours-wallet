/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useContext, useEffect, useState } from 'react';
import { MemoryRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { Show } from './components/Show';
import { UnlockWallet } from './components/UnlockWallet';
import { BottomMenuContext } from './contexts/BottomMenuContext';
import { useActivityDetector } from './hooks/useActivityDetector';
import { useTheme } from './hooks/useTheme';
import { useViewport } from './hooks/useViewport';
import { AppsAndTools } from './pages/AppsAndTools';
import { BsvWallet } from './pages/BsvWallet';
import { CreateAccount } from './pages/onboarding/CreateAccount';
import { ImportAccount } from './pages/onboarding/ImportAccount';
import { RestoreAccount } from './pages/onboarding/RestoreAccount';
import { Start } from './pages/onboarding/Start';
import { OrdWallet } from './pages/OrdWallet';
import { BroadcastRequest } from './pages/requests/BroadcastRequest';
import { BsvSendRequest } from './pages/requests/BsvSendRequest';
import { ConnectRequest } from './pages/requests/ConnectRequest';
import { DecryptRequest } from './pages/requests/DecryptRequest';
import { EncryptRequest } from './pages/requests/EncryptRequest';
import { GenerateTaggedKeysRequest } from './pages/requests/GenerateTaggedKeysRequest';
import { GetSignaturesRequest } from './pages/requests/GetSignaturesRequest';
import { OrdPurchaseRequest } from './pages/requests/OrdPurchaseRequest';
import { OrdTransferRequest } from './pages/requests/OrdTransferRequest';
import { SignMessageRequest } from './pages/requests/SignMessageRequest';
import { Settings } from './pages/Settings';
import { WhiteLabelTheme } from './theme.types';
import { WhitelistedApp } from './inject';
import { PageLoader } from './components/PageLoader';
import { useServiceContext } from './hooks/useServiceContext';
import { useWeb3RequestContext } from './hooks/useWeb3RequestContext';
import { MasterRestore } from './pages/onboarding/MasterRestore';
import { Bsv20SendRequest } from './pages/requests/Bsv20SendRequest';
import { BlockHeightProvider } from './contexts/providers/BlockHeightProvider';
import { QueueProvider } from './contexts/providers/QueueProvider';
import { BottomMenuProvider } from './contexts/providers/BottomMenuProvider';
import { SnackbarProvider } from './contexts/providers/SnackbarProvider';
import { MNEESendRequest } from './pages/requests/MNEESendRequest';
import { Modal } from './components/Modal';
import { useWalletConnectMessaging } from './hooks/useWalletConnectMessaging';
import { Button } from './components/Button';
import { DappBrowser } from './pages/DappBrowser';
import { DappFullPage } from './pages/DappFullPage';

const MainContainer = styled.div<WhiteLabelTheme & { $isMobile?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-width: 100vw;
  width: 100vw;
  height: 100vh;
  position: relative;
  padding: 0;
  background-color: ${({ theme }) => theme.color.global.walletBackground};
  overflow: hidden;
  @media (max-width: 600px) {
    min-width: 100vw;
    min-height: 100vh;
    width: 100vw;
    height: 100vh;
    padding: 0;
    overflow: auto;
  }
`;

const Container = styled.div<WhiteLabelTheme>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 380px;
  height: 600px;
  max-width: 100vw;
  max-height: 100vh;
  min-width: 0;
  min-height: 0;
  background-color: ${({ theme }) => theme.color.global.walletBackground};
  position: relative;
  border-radius: 1.5rem;
  box-shadow: 0 4px 32px 0 rgba(0, 0, 0, 0.1);
  margin: 0 auto;
  padding: 1rem 0.5rem 3.5rem 0.5rem;
  box-sizing: border-box;
  overflow: hidden;
  @media (max-width: 600px) {
    width: 360px;
    height: 540px;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 1rem;
    margin: 0 auto;
    padding: 0.5rem 0.25rem 2.5rem 0.25rem;
    box-shadow: 0 2px 16px 0 rgba(0,0,0,0.08);
    overflow: hidden;
  }
`;

export const App = () => {
  const { isMobile } = useViewport();
  const { theme } = useTheme();
  const { isLocked, isReady, chromeStorageService, setIsLocked } = useServiceContext();
  const menuContext = useContext(BottomMenuContext);
  const {
    connectRequest,
    setConnectRequest, // <-- get setter
    sendBsvRequest,
    setSendBsvRequest, // <-- add this line
    sendBsv20Request,
    sendMNEERequest,
    transferOrdinalRequest,
    purchaseOrdinalRequest,
    signMessageRequest,
    broadcastRequest,
    getSignaturesRequest,
    generateTaggedKeysRequest,
    encryptRequest,
    decryptRequest,
    clearRequest,
    popupId,
    getStorageAndSetRequestState,
  } = useWeb3RequestContext();
  const [whitelistedApps, setWhitelistedApps] = useState<WhitelistedApp[]>([]);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    (async () => {
      await chromeStorageService.getAndSetStorage();
      setStorageReady(true);
    })();
  }, [chromeStorageService]);

  useEffect(() => {
    if (isReady) {
      const { account } = chromeStorageService.getCurrentAccountObject();
      setWhitelistedApps(account?.settings?.whitelist ?? []);
    }
  }, [chromeStorageService, isReady]);

  useActivityDetector(isLocked, isReady, chromeStorageService);

  useEffect(() => {
    isReady && getStorageAndSetRequestState(chromeStorageService);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const handleUnlock = async () => {
    setIsLocked(false);
    menuContext?.handleSelect('bsv');
  };

  useEffect(() => {
    if (transferOrdinalRequest || purchaseOrdinalRequest) {
      menuContext?.handleSelect('ords');
    }
  }, [transferOrdinalRequest, purchaseOrdinalRequest, menuContext]);

  // Listen for CONNECT_REQUEST postMessages and set connectRequest if on /connect
  useEffect(() => {
    function handleConnectMessage(event: MessageEvent) {
      if (
        window.location.pathname === '/connect' &&
        event.data &&
        typeof event.data === 'object' &&
        event.data.type === 'CONNECT_REQUEST' &&
        !connectRequest // Only set if not already pending
      ) {
        setConnectRequest({
          appName: event.data.appName || 'External dApp',
          appIcon: event.data.appIcon || '',
          domain: event.origin,
          isAuthorized: false,
        });
      }
    }
    window.addEventListener('message', handleConnectMessage);
    return () => window.removeEventListener('message', handleConnectMessage);
  }, [setConnectRequest, connectRequest]);

  // Listen for GET_BALANCE postMessages and respond with balance, then close the popup
  useEffect(() => {
    function handleGetBalanceMessage(event: MessageEvent) {
      if (
        event.data &&
        typeof event.data === 'object' &&
        event.data.type === 'GET_BALANCE' &&
        event.data.address
      ) {
        // Get balance for the requested address
        const { address } = event.data;
        try {
          const current = chromeStorageService.getCurrentAccountObject();
          const account = current?.account;
          if (account && account.addresses.bsvAddress === address) {
            const balance = account.balance?.bsv ?? 0;
            (event.source as Window)?.postMessage({ type: 'WALLET_BALANCE', balance }, '*');
          } else {
            (event.source as Window)?.postMessage({ type: 'WALLET_BALANCE', balance: 0 }, '*');
          }
        } catch (e) {
          (event.source as Window)?.postMessage({ type: 'WALLET_BALANCE', balance: 0 }, '*');
        }
        setTimeout(() => {
          if (window.opener) window.close();
        }, 300);
      }
    }
    window.addEventListener('message', handleGetBalanceMessage);
    return () => window.removeEventListener('message', handleGetBalanceMessage);
  }, [chromeStorageService]);

  // Ensure connectRequest is set from URL param if on /connect and not already set
  useEffect(() => {
    if (window.location.pathname === '/connect' && !connectRequest) {
      const params = new URLSearchParams(window.location.search);
      const reqParam = params.get('request');
      if (reqParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(reqParam));
          setConnectRequest({
            appName: parsed.appName || 'External dApp',
            appIcon: parsed.appIcon || '',
            domain: parsed.origin || '',
            isAuthorized: false,
          });
        } catch (e) {
          // ignore
        }
      }
    }
  }, [connectRequest, setConnectRequest]);

  // Listen for SEND_BSV postMessages and set sendBsvRequest
  useEffect(() => {
    function handleSendBsvMessage(event: MessageEvent) {
      if (
        event.data &&
        typeof event.data === 'object' &&
        event.data.type === 'SEND_BSV' &&
        event.data.to && event.data.amount
      ) {
        // Set the sendBsvRequest state with the correct format
        setSendBsvRequest([
          {
            address: event.data.to,
            satoshis: Number(event.data.amount),
          },
        ]);
      }
    }
    window.addEventListener('message', handleSendBsvMessage);
    return () => window.removeEventListener('message', handleSendBsvMessage);
  }, [setSendBsvRequest]);

  // Navigate to /connect when sendBsvRequest is set
  useEffect(() => {
    if (sendBsvRequest && sendBsvRequest.length > 0) {
      window.location.pathname !== '/connect' && window.location.assign('/connect');
    }
  }, [sendBsvRequest]);

  // Listen for GET_SOCIAL_PROFILE postMessages and respond with social profile, then close the popup
  useEffect(() => {
    function handleGetSocialProfileMessage(event: MessageEvent) {
      if (
        event.data &&
        typeof event.data === 'object' &&
        (event.data.type === 'GET_SOCIAL_PROFILE' || event.data.type === 'getSocialProfile')
      ) {
        try {
          const current = chromeStorageService.getCurrentAccountObject();
          const account = current?.account;
          const profile = account?.settings?.socialProfile || { displayName: 'Anonymous', avatar: '' };
          (event.source as Window)?.postMessage({
            type: 'getSocialProfile',
            success: true,
            data: profile,
          }, '*');
        } catch (e) {
          (event.source as Window)?.postMessage({
            type: 'getSocialProfile',
            success: false,
            error: 'Could not load social profile',
          }, '*');
        }
        setTimeout(() => {
          if (window.opener) window.close();
        }, 300);
      }
    }
    window.addEventListener('message', handleGetSocialProfileMessage);
    return () => window.removeEventListener('message', handleGetSocialProfileMessage);
  }, [chromeStorageService]);

  // Get current account address for wallet connect
  let walletAddress: string | undefined = undefined;
  try {
    const current = chromeStorageService.getCurrentAccountObject();
    walletAddress = current?.account?.addresses?.bsvAddress;
  } catch (e) {
    walletAddress = undefined;
  }

  // Wallet connect messaging hook (move this above render)
  const { pendingRequest, approve, deny } = useWalletConnectMessaging(walletAddress);

  // Determine if a wallet/account exists
  let hasWalletOrAccount = false;
  try {
    const current = chromeStorageService.getCurrentAccountObject();
    hasWalletOrAccount = !!(current && current.account && current.account.encryptedKeys);
  } catch (e) {
    hasWalletOrAccount = false;
  }

  if (!isReady || !storageReady) {
    return (
      <Router>
        <MainContainer $isMobile={isMobile} theme={theme}>
          <PageLoader message="Loading..." theme={theme} />
        </MainContainer>
      </Router>
    );
  }

  return (
    <Router>
      <MainContainer $isMobile={isMobile} theme={theme}>
        <BlockHeightProvider>
          <QueueProvider>
            <BottomMenuProvider network={chromeStorageService.getNetwork()}>
              <Container theme={theme}>
                <SnackbarProvider>
                  {/* Wallet Connect Modal */}
                  <Modal open={!!pendingRequest} onClose={() => deny()}>
                    <h2>Connect to Site</h2>
                    <p style={{ margin: '1rem 0' }}>
                      {pendingRequest ? (
                        <>
                          <b>Origin:</b> {pendingRequest.origin}
                        </>
                      ) : null}
                    </p>
                    <Button theme={theme} type="primary" label="Approve" onClick={approve} />
                    <Button theme={theme} type="secondary" label="Deny" onClick={() => deny()} />
                  </Modal>
                  {/* Payment Approval Modal */}
                  <Modal open={!!sendBsvRequest && sendBsvRequest.length > 0} onClose={() => clearRequest('sendBsvRequest')}>
                    {sendBsvRequest && sendBsvRequest.length > 0 && (
                      <BsvSendRequest request={sendBsvRequest} popupId={popupId} onResponse={() => clearRequest('sendBsvRequest')} />
                    )}
                  </Modal>
                  <Show when={!isLocked} whenFalseContent={<UnlockWallet onUnlock={handleUnlock} />}>
                    <Routes>
                      <Route path="/bsv-wallet" element={
                        hasWalletOrAccount
                          ? <BsvWallet isOrdRequest={!!transferOrdinalRequest || !!purchaseOrdinalRequest} />
                          : <Navigate to="/" replace />
                      } />
                      <Route path="/ord-wallet" element={
                        hasWalletOrAccount
                          ? <OrdWallet />
                          : <Navigate to="/" replace />
                      } />
                      <Route path="/tools" element={<AppsAndTools />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/browser" element={<DappBrowser />} />
                      <Route path="/create-wallet" element={<CreateAccount onNavigateBack={() => null} newWallet />} />
                      <Route path="/restore-wallet" element={<RestoreAccount onNavigateBack={() => null} newWallet />} />
                      <Route path="/import-wallet" element={<ImportAccount onNavigateBack={() => null} newWallet />} />
                      <Route path="/master-restore" element={<MasterRestore />} />
                      <Route path="/connect" element={
                        <ConnectRequest request={connectRequest} onDecision={() => clearRequest('connectRequest')} whiteListedApps={whitelistedApps} popupId={popupId} />
                      } />
                      <Route path="/browser/view" element={<DappFullPage />} />
                      <Route path="/" element={<Start storageReady={storageReady} />} />
                    </Routes>
                  </Show>
                </SnackbarProvider>
              </Container>
            </BottomMenuProvider>
          </QueueProvider>
        </BlockHeightProvider>
      </MainContainer>
    </Router>
  );
};
