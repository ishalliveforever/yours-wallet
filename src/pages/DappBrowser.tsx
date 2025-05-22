import React, { useState } from 'react';
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
        <Iframe src={iframeUrl} title="dApp Browser" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
      )}
    </BrowserContent>
  );
};
