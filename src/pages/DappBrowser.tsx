import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTheme } from '../hooks/useTheme';

const BrowserContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background: #fff;
`;
const TabsBar = styled.div`
  display: flex;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
`;
const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${({ $active }) => ($active ? '#e0e0e0' : 'transparent')};
  border: none;
  border-right: 1px solid #ccc;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: #222;
  cursor: pointer;
  position: relative;
`;
const CloseBtn = styled.span`
  margin-left: 0.5rem;
  color: #888;
  cursor: pointer;
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
const NewTabButton = styled.button`
  font-size: 1rem;
  padding: 0.5rem 1rem;
  margin-left: 0.5rem;
  border-radius: 6px;
  background: #4fa3ff;
  color: #fff;
  border: none;
`;
const Iframe = styled.iframe`
  width: 100%;
  flex: 1;
  border: none;
`;

const LOCAL_STORAGE_KEY = 'yoursWalletBrowserTabs';
const LOCAL_STORAGE_IDX = 'yoursWalletBrowserActiveTabIdx';

export const DappBrowser: React.FC = () => {
  const { theme } = useTheme();
  const [tabs, setTabs] = useState<{ url: string }[]>([{ url: 'https://' }]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [inputUrl, setInputUrl] = useState('https://');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage
  useEffect(() => {
    const savedTabs = localStorage.getItem(LOCAL_STORAGE_KEY);
    const savedIdx = localStorage.getItem(LOCAL_STORAGE_IDX);
    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
          setInputUrl(parsed[Number(savedIdx) || 0]?.url || 'https://');
          setActiveIdx(Number(savedIdx) || 0);
        }
      } catch {}
    }
  }, []);
  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tabs));
    localStorage.setItem(LOCAL_STORAGE_IDX, String(activeIdx));
  }, [tabs, activeIdx]);

  // Update input when switching tabs
  useEffect(() => {
    setInputUrl(tabs[activeIdx]?.url || 'https://');
  }, [activeIdx, tabs]);

  const handleGo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTabs(tabs => {
      const newTabs = [...tabs];
      newTabs[activeIdx] = { url: inputUrl };
      return newTabs;
    });
  };
  const handleNewTab = () => {
    setTabs(tabs => [...tabs, { url: 'https://' }]);
    setActiveIdx(tabs.length);
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  const handleCloseTab = (idx: number) => {
    if (tabs.length === 1) return;
    setTabs(tabs => {
      const newTabs = tabs.filter((_, i) => i !== idx);
      if (activeIdx >= newTabs.length) setActiveIdx(newTabs.length - 1);
      return newTabs;
    });
    if (activeIdx === idx && idx > 0) setActiveIdx(idx - 1);
  };
  const handleSwitchTab = (idx: number) => {
    setActiveIdx(idx);
  };

  return (
    <BrowserContent>
      <TabsBar>
        {tabs.map((tab, idx) => (
          <TabButton key={idx} $active={idx === activeIdx} onClick={() => handleSwitchTab(idx)}>
            {tab.url.length > 30 ? tab.url.slice(0, 30) + '…' : tab.url || 'New Tab'}
            {tabs.length > 1 && (
              <CloseBtn onClick={e => { e.stopPropagation(); handleCloseTab(idx); }}>×</CloseBtn>
            )}
          </TabButton>
        ))}
        <NewTabButton onClick={handleNewTab}>+</NewTabButton>
      </TabsBar>
      <UrlBar onSubmit={handleGo}>
        <UrlInput
          ref={inputRef}
          type="text"
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          placeholder="Enter dApp URL (e.g. https://...)"
        />
        <GoButton type="submit">Go</GoButton>
      </UrlBar>
      <Iframe
        key={activeIdx}
        src={tabs[activeIdx]?.url || 'about:blank'}
        title="dApp Browser"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </BrowserContent>
  );
};
