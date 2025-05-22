import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import gihubIcon from '../../assets/github.svg';
import { Button } from '../../components/Button';
import { GithubIcon, Text } from '../../components/Reusable';
import { Show } from '../../components/Show';
import { useBottomMenu } from '../../hooks/useBottomMenu';
import { useTheme } from '../../hooks/useTheme';
import { WhiteLabelTheme } from '../../theme.types';
import { useServiceContext } from '../../hooks/useServiceContext';
import { YoursIcon } from '../../components/YoursIcon';

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const TitleText = styled.h1<WhiteLabelTheme>`
  font-size: 2rem;
  color: ${({ theme }) => theme.color.global.contrast};
  font-family: 'Inter', Arial, Helvetica, sans-serif;
  font-weight: 700;
  margin: 0.25rem 0;
  text-align: center;
`;

export const Start = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showStart, setShowStart] = useState(false);
  const { hideMenu, showMenu } = useBottomMenu();
  const { chromeStorageService } = useServiceContext();
  let account: any = undefined;
  let encryptedKeys: any = undefined;
  let errorMsg = '';
  try {
    account = chromeStorageService.getCurrentAccountObject().account;
    encryptedKeys = account?.encryptedKeys;
    console.log('[Start.tsx] account:', account);
    console.log('[Start.tsx] encryptedKeys:', encryptedKeys);
    if (!account) errorMsg = 'Error: Account is undefined. Storage may not be working.';
  } catch (e) {
    let msg = '';
    if (typeof e === 'object' && e && 'message' in e) {
      msg = (e as any).message;
    } else {
      msg = String(e);
    }
    errorMsg = 'Exception reading account: ' + msg;
    console.error('[Start.tsx] Exception:', e);
  }

  useEffect(() => {
    hideMenu();
    return () => {
      showMenu();
    };
  }, [hideMenu, showMenu]);

  useEffect(() => {
    if (encryptedKeys) {
      setShowStart(false);
      console.log('[Start.tsx] encryptedKeys found, navigating to /bsv-wallet');
      navigate('/bsv-wallet');
      return;
    }
    setShowStart(true);
    console.log('[Start.tsx] No encryptedKeys, showing onboarding.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encryptedKeys]);

  if (errorMsg) {
    return (
      <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>
        {errorMsg}
        <br />
        <span style={{ color: '#888' }}>[This error is visible only in onboarding screen]</span>
      </div>
    );
  }

  try {
    return (
      <Show when={showStart}>
        <Content>
          <YoursIcon width="4rem" />
          <TitleText theme={theme}>{`${theme.settings.walletName} Wallet`}</TitleText>
          <Text theme={theme} style={{ margin: '0.25rem 0 1rem 0' }}>
            An open source project.
          </Text>
          <Button theme={theme} type="primary" label="Create New Wallet" onClick={() => navigate('/create-wallet')} />
          <Button
            theme={theme}
            type="secondary-outline"
            label="Restore Wallet"
            onClick={() => navigate('/restore-wallet')}
          />
          <GithubIcon
            style={{ marginTop: '1rem' }}
            src={gihubIcon}
            onClick={() => window.open(theme.settings.repo, '_blank')}
          />
        </Content>
      </Show>
    );
  } catch (err) {
    return (
      <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>
        Error rendering onboarding: {String(err)}
      </div>
    );
  }
};
