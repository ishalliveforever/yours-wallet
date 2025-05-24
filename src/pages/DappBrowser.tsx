import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';

const BrowserContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const UrlBar = styled.form`
  display: flex;
  width: 100%;
  padding: 0.5rem;
  background: #fafbfc;
  border-bottom: 1px solid #eee;
`;

const UrlInput = styled.input`
  flex: 1;
  font-size: 1rem;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
`;

const GoButton = styled.button`
  font-size: 1rem;
  padding: 0.5rem 1rem;
  margin-left: 0.5rem;
  border-radius: 6px;
  background: #222;
  color: #fff;
  border: none;
`;

const Iframe = styled.iframe`
  width: 100%;
  flex: 1;
  border: none;
`;

const BrowserContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: #fff;
`;

export const DappBrowser: React.FC = () => {
  const { theme } = useTheme();
  const [url, setUrl] = useState('https://');
  const [iframeUrl, setIframeUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Inject wallet provider bridge into iframe after load
  useEffect(() => {
    if (!iframeUrl || !iframeRef.current) return;
    const iframe = iframeRef.current;
    function handleIframeLoad() {
      try {
        // Inject a bridge script for wallet connect
        iframe.contentWindow?.postMessage({ type: 'YOURS_WALLET_IFRAME_READY' }, '*');
      } catch (e) {
        // Intentionally left blank (iframe may be cross-origin)
      }
    }
    iframe.addEventListener('load', handleIframeLoad);
    return () => iframe.removeEventListener('load', handleIframeLoad);
  }, [iframeUrl]);

  // Relay wallet connect requests from iframe to parent app
  useEffect(() => {
    function handleIframeMessage(event: MessageEvent) {
      // Only relay CONNECT_REQUEST from iframe to parent
      if (event.source === iframeRef.current?.contentWindow && event.data && event.data.type === 'CONNECT_REQUEST') {
        window.postMessage(event.data, '*');
      }
    }
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  return (
    <BrowserContent>
      <UrlBar
        onSubmit={e => {
          e.preventDefault();
          if (url && url.startsWith('http')) {
            setIframeUrl(url);
          }
        }}
      >
        <UrlInput
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter dApp URL (e.g. https://...)"
        />
        <GoButton type="submit">Go</GoButton>
      </UrlBar>
      {iframeUrl && (
        <Iframe
          ref={iframeRef}
          src={iframeUrl}
          title="dApp Browser"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )}
    </BrowserContent>
  );
};
