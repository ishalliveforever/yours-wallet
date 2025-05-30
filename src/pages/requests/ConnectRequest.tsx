import { useContext, useEffect } from 'react';
import { styled } from 'styled-components';
import { Button } from '../../components/Button';
import { HeaderText, Text } from '../../components/Reusable';
import { Show } from '../../components/Show';
import { BottomMenuContext } from '../../contexts/BottomMenuContext';
import { useSnackbar } from '../../hooks/useSnackbar';
import { useTheme } from '../../hooks/useTheme';
import greenCheck from '../../assets/green-check.svg';
import { WhiteLabelTheme } from '../../theme.types';
import { RequestParams, WhitelistedApp } from '../../inject';
import { sendMessage } from '../../utils/chromeHelpers';
import { useServiceContext } from '../../hooks/useServiceContext';
import { ChromeStorageObject } from '../../services/types/chromeStorage.types';
import { sleep } from '../../utils/sleep';
import { useNavigate, useLocation } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const Icon = styled.img<{ size: string }>`
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  margin: 0 0 1rem 0;
  border-radius: 0.5rem;
`;

const PermissionsContainer = styled.div<WhiteLabelTheme>`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  width: 75%;
  background-color: ${({ theme }) => theme.color.global.row};
  border-radius: 0.75rem;
  margin: 1rem 0 1.5rem 0;
`;

const Permission = styled.div`
  display: flex;
  align-items: center;
  margin: 0.5rem;
`;

const CheckMark = styled.img`
  width: 1rem;
  height: 1rem;
`;

export type ConnectRequestProps = {
  request: RequestParams | undefined;
  whiteListedApps: WhitelistedApp[];
  popupId: number | undefined;
  onDecision: () => void;
};

export const ConnectRequest = (props: ConnectRequestProps) => {
  const { request, whiteListedApps, onDecision } = props;
  const { theme } = useTheme();
  const context = useContext(BottomMenuContext);
  const { addSnackbar } = useSnackbar();
  const { keysService, chromeStorageService } = useServiceContext();
  const { identityPubKey, bsvPubKey, ordPubKey, identityAddress } = keysService;
  const navigate = useNavigate();
  const location = useLocation();

  // Parse request and returnUrl from URL if not provided
  let urlRequest = request;
  let urlReturn = '';
  try {
    const params = new URLSearchParams(location.search);
    if (!urlRequest && params.get('request')) {
      urlRequest = JSON.parse(decodeURIComponent(params.get('request')!));
    }
    urlReturn = params.get('returnUrl') ? decodeURIComponent(params.get('returnUrl')!) : '';
  } catch (e) {
    // Intentionally left blank (non-localhost or missing keys)
  }

  useEffect(() => {
    if (!context) return;
    context.hideMenu();

    return () => context.showMenu();
  }, [context]);

  useEffect(() => {
    if (!request?.isAuthorized) return;
    if (!identityPubKey || !bsvPubKey || !ordPubKey) return;
    if (!window.location.href.includes('localhost')) {
      onDecision();
      sendMessage({
        action: 'userConnectResponse',
        decision: 'approved',
        pubKeys: { identityPubKey, bsvPubKey, ordPubKey },
      });
    }
  }, [request, identityPubKey, bsvPubKey, ordPubKey, onDecision]);

  const handleAccept = async () => {
    const { account } = chromeStorageService.getCurrentAccountObject();
    if (!account) throw Error('No account found');
    const { settings } = account;
    const key: keyof ChromeStorageObject = 'accounts';
    const update: Partial<ChromeStorageObject['accounts']> = {
      [identityAddress]: {
        ...account,
        settings: {
          ...settings,
          whitelist: [
            ...whiteListedApps,
            {
              domain: request?.domain ?? '',
              icon: request?.appIcon ?? '',
            },
          ],
        },
      },
    };
    await chromeStorageService.updateNested(key, update);
    // Sync whitelist to localStorage for browser hamburger menu
    const newWhitelist = [
      ...whiteListedApps,
      {
        domain: request?.domain ?? '',
        icon: request?.appIcon ?? '',
      },
    ];
    // Store as array of { url, favicon } for browser.html
    localStorage.setItem(
      'yoursWalletConnectedSites',
      JSON.stringify(
        newWhitelist.map(app => ({ url: app.domain, favicon: app.icon }))
      )
    );
    addSnackbar(`Approved`, 'success');
    await sleep(2000);
    onDecision(); // <-- clear connectRequest state immediately
    sendMessage({
      action: 'userConnectResponse',
      decision: 'approved',
      pubKeys: { bsvPubKey, ordPubKey, identityPubKey },
    });
    // Send postMessage to opener for dApp integration
    if (window.opener) {
      window.opener.postMessage({ type: 'WALLET_CONNECTED', address: account.addresses.bsvAddress }, '*');
    }
    setTimeout(() => {
      if (window.opener) {
        window.close(); // Close popup if opened as one
      } else if (urlReturn) {
        // Redirect back to dApp with result
        const resultUrl = new URL(urlReturn);
        resultUrl.searchParams.set('result', 'approved');
        resultUrl.searchParams.set('address', account.addresses.bsvAddress);
        window.location.href = resultUrl.toString();
      } else if (window.location.pathname === '/connect') {
        navigate('/bsv-wallet');
      }
    }, 300);
  };

  const handleDecline = async () => {
    onDecision(); // <-- clear connectRequest state immediately
    sendMessage({
      action: 'userConnectResponse',
      decision: 'declined',
    });
    addSnackbar(`Declined`, 'error');
    setTimeout(() => {
      if (window.opener) {
        window.close();
      } else if (urlReturn) {
        // Redirect back to dApp with result
        const resultUrl = new URL(urlReturn);
        resultUrl.searchParams.set('result', 'declined');
        window.location.href = resultUrl.toString();
      } else if (window.location.pathname === '/connect') {
        navigate('/bsv-wallet');
      }
    }, 300);
  };

  return (
    <Show
      when={!urlRequest?.isAuthorized}
      whenFalseContent={
        <Container>
          <Text theme={theme} style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Reconnecting to {urlRequest?.appName} ...
          </Text>
        </Container>
      }
    >
      <Container>
        <Icon size="5rem" src={urlRequest?.appIcon} />
        <HeaderText theme={theme} style={{ width: '90%' }}>
          {urlRequest?.appName}
        </HeaderText>
        <Text theme={theme} style={{ marginBottom: '1rem' }}>
          {urlRequest?.domain}
        </Text>
        <PermissionsContainer theme={theme}>
          <Permission>
            <CheckMark style={{ marginRight: '1rem' }} src={greenCheck} />
            <Text
              theme={theme}
              style={{
                color: theme.color.global.contrast,
                margin: 0,
                textAlign: 'left',
              }}
            >
              View your wallet public keys
            </Text>
          </Permission>
          <Permission>
            <CheckMark style={{ marginRight: '1rem' }} src={greenCheck} />
            <Text
              theme={theme}
              style={{
                color: theme.color.global.contrast,
                margin: 0,
                textAlign: 'left',
              }}
            >
              Request approval for transactions
            </Text>
          </Permission>
        </PermissionsContainer>
        <Button
          theme={theme}
          type="primary"
          label="Connect"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            handleAccept();
          }}
        />
        <Button
          theme={theme}
          type="secondary-outline"
          label="Cancel"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            handleDecline();
          }}
        />
      </Container>
    </Show>
  );
};
