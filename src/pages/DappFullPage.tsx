import React from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';

const Iframe = styled.iframe`
  width: 100%;
  height: 100vh;
  border: none;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  background: #fafbfc;
  border-bottom: 1px solid #eee;
  padding: 0.5rem;
`;

const BackButton = styled.button`
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  background: #222;
  color: #fff;
  border: none;
  margin-right: 1rem;
`;

export const DappFullPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const url = params.get('url') || '';

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar>
        <BackButton onClick={() => navigate(-1)}>Back</BackButton>
        <span style={{ fontSize: 14, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
      </TopBar>
      <Iframe src={url} title="dApp Full Page" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
    </div>
  );
};
