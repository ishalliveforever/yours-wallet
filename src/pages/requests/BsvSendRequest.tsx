import { useState, useEffect } from 'react';
import { validate } from 'bitcoin-address-validation';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PageLoader } from '../../components/PageLoader';
import { ConfirmContent, FormContainer, HeaderText, Text } from '../../components/Reusable';
import { Show } from '../../components/Show';
import { useBottomMenu } from '../../hooks/useBottomMenu';
import { useSnackbar } from '../../hooks/useSnackbar';
import { useTheme } from '../../hooks/useTheme';
import { BSV_DECIMAL_CONVERSION } from '../../utils/constants';
import { sleep } from '../../utils/sleep';
import { sendMessage } from '../../utils/chromeHelpers';
import { SendBsv } from 'yours-wallet-provider';
import { useServiceContext } from '../../hooks/useServiceContext';
import { getErrorMessage, getTxFromRawTxFormat } from '../../utils/tools';
import { IndexContext } from 'spv-store';
import TxPreview from '../../components/TxPreview';
import { styled } from 'styled-components';

const Wrapper = styled(ConfirmContent)`
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
`;

export type BsvSendRequestProps = {
  request: SendBsv[];
  requestWithinApp?: boolean;
  popupId: number | undefined;
  onResponse: () => void;
};

export const BsvSendRequest = (props: BsvSendRequestProps) => {
  const { request, requestWithinApp, popupId, onResponse } = props;
  const { theme } = useTheme();
  const { handleSelect, hideMenu } = useBottomMenu();
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [successTxId, setSuccessTxId] = useState('');
  const { addSnackbar, message } = useSnackbar();
  const { bsvService, chromeStorageService, keysService, oneSatSPV } = useServiceContext();
  const { sendBsv, updateBsvBalance, getBsvBalance } = bsvService;
  const { bsvAddress } = keysService;
  const [hasSent, setHasSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txData, setTxData] = useState<IndexContext>();

  const { account } = chromeStorageService.getCurrentAccountObject();
  if (!account) throw Error('No account found');
  const { settings } = account;
  const noApprovalLimit = settings.noApprovalLimit ?? 0;
  const isPasswordRequired = chromeStorageService.isPasswordRequired();

  const requestSats = request.reduce((a: number, item: { satoshis: number }) => a + item.satoshis, 0);
  const bsvSendAmount = requestSats / BSV_DECIMAL_CONVERSION;

  const processBsvSend = async (showPreview = false) => {
    try {
      const validationFail = new Map<string, boolean>();
      validationFail.set('address', false);
      validationFail.set('script', false);
      validationFail.set('data', false);

      request.forEach((req, idx) => {
        if (req.script?.length === 0) {
          validationFail.set('script', true);
          return;
        } else if (req.data) {
          if (req.data.length === 0) {
            validationFail.set('data', true);
            return;
          }
        }
        if (req.address) {
          if (req.address.includes('@')) {
            request[idx].paymail = req.address;
            request[idx].address = undefined;
            return;
          }
          if (!validate(req.address)) {
            validationFail.set('address', true);
            return;
          }
        }
      });

      let validationErrorMessage = '';
      if (validationFail.get('script')) {
        validationErrorMessage = 'Found an invalid script.';
      } else if (validationFail.get('data')) {
        validationErrorMessage = 'Found an invalid data.';
      } else if (validationFail.get('address')) {
        validationErrorMessage = 'Found an invalid receive address.';
      }

      if (validationErrorMessage) {
        addSnackbar(validationErrorMessage, 'error');
        // Send error to opener and close popup
        if (!requestWithinApp && window.opener) {
          window.opener.postMessage({ type: 'SEND_BSV_RESULT', success: false, error: validationErrorMessage }, '*');
          setTimeout(() => window.close(), 300);
        }
        return;
      }

      if (request[0].address && !request[0].satoshis) {
        addSnackbar('No sats supplied', 'info');
        // Send error to opener and close popup
        if (!requestWithinApp && window.opener) {
          window.opener.postMessage({ type: 'SEND_BSV_RESULT', success: false, error: 'No sats supplied' }, '*');
          setTimeout(() => window.close(), 300);
        }
        return;
      }

      const sendRes = await sendBsv(request, passwordConfirm, noApprovalLimit, showPreview);
      if (!sendRes.txid && sendRes.rawtx) {
        const tx = getTxFromRawTxFormat(sendRes.rawtx, 'tx');
        const parsedTx = await oneSatSPV.parseTx(tx);
        setTxData(parsedTx);
        return;
      }

      if (!sendRes.txid || sendRes.error) {
        addSnackbar(getErrorMessage(sendRes.error), 'error');
        // Send error to opener and close popup
        if (!requestWithinApp && window.opener) {
          window.opener.postMessage({ type: 'SEND_BSV_RESULT', success: false, error: getErrorMessage(sendRes.error) }, '*');
          setTimeout(() => window.close(), 300);
        }
        return;
      }

      setSuccessTxId(sendRes.txid);
      addSnackbar('Transaction Successful!', 'success');
      await sleep(2000);
      onResponse();

      if (!requestWithinApp) {
        // Send success to opener and close popup
        if (window.opener) {
          window.opener.postMessage({ type: 'SEND_BSV_RESULT', success: true, txid: sendRes.txid }, '*');
          setTimeout(() => window.close(), 300);
        }
        // Still send legacy message for compatibility
        sendMessage({
          action: 'sendBsvResponse',
          txid: sendRes.txid,
          rawtx: sendRes.rawtx,
        });
      }
    } catch (error) {
      console.log(error);
      // Send error to opener and close popup
      if (!requestWithinApp && window.opener) {
        window.opener.postMessage({ type: 'SEND_BSV_RESULT', success: false, error: error?.message || 'Unknown error' }, '*');
        setTimeout(() => window.close(), 300);
      }
    } finally {
      setIsProcessing(false);
    }    git add .
    git commit -m "Initial commit"
  };

  useEffect(() => {
    if (!request) return;
    processBsvSend(true); // Show preview
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  // This useEffect used to auto process requests when an approval limit is set
  useEffect(() => {
    if (hasSent || noApprovalLimit === undefined) return;
    if (request.length > 0 && bsvSendAmount <= noApprovalLimit) {
      setHasSent(true);

      setTimeout(async () => {
        setIsProcessing(true);
        await processBsvSend();
        setIsProcessing(false);
        await updateBsvBalance();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bsvSendAmount, hasSent, noApprovalLimit]);

  // This useEffect used to process yours wallet donations within the app
  useEffect(() => {
    if (requestWithinApp) return;
    handleSelect('bsv');
    hideMenu();
  }, [requestWithinApp, handleSelect, hideMenu]);

  const resetSendState = () => {
    setPasswordConfirm('');
    setSuccessTxId('');
    setIsProcessing(false);
  };

  useEffect(() => {
    if (!successTxId) return;
    if (!message && bsvAddress) {
      resetSendState();
      updateBsvBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bsvAddress, message, successTxId]);

  const handleSendBsv = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    await sleep(25);

    if (noApprovalLimit === undefined) throw Error('No approval limit must be a number');
    if (!passwordConfirm && isPasswordRequired && bsvSendAmount > noApprovalLimit) {
      addSnackbar('You must enter a password!', 'error');
      setIsProcessing(false);
      return;
    }

    processBsvSend();
  };

  const clearRequest = async () => {
    await chromeStorageService.remove('sendBsvRequest');
    window.location.reload();
  };

  return (
    <>
      <Show when={isProcessing}>
        <PageLoader theme={theme} message="Sending BSV..." />
      </Show>
      <Show when={!isProcessing && !!request && !hasSent}>
        <Wrapper>
          <HeaderText theme={theme}>Approve Payment</HeaderText>
          <Text
            theme={theme}
            style={{ cursor: 'pointer', margin: '0.75rem 0' }}
          >{`Available Balance: ${getBsvBalance()}`}</Text>
          <FormContainer noValidate onSubmit={(e) => handleSendBsv(e)}>
            <Show when={isPasswordRequired}>
              <Input
                theme={theme}
                placeholder="Enter Wallet Password"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </Show>
            {txData && <TxPreview txData={txData} />}
            <Button
              theme={theme}
              type="primary"
              label={`Pay ${request.reduce((a, item) => a + item.satoshis, 0) / BSV_DECIMAL_CONVERSION} BSV to Unlock`}
              disabled={isProcessing}
              isSubmit
            />
            <Button theme={theme} type="secondary" label="Cancel" onClick={clearRequest} disabled={isProcessing} />
          </FormContainer>
        </Wrapper>
      </Show>
    </>
  );
};
