import React from 'react';
import styled from 'styled-components';
import { WhiteLabelTheme } from '../theme.types';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBox = styled.div<WhiteLabelTheme>`
  background: ${({ theme }) => theme.color.global.walletBackground};
  color: ${({ theme }) => theme.color.global.contrast};
  border-radius: 1rem;
  box-shadow: 0 2px 24px rgba(0,0,0,0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  min-width: 320px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const Modal = ({ open, onClose, children }: ModalProps) => {
  if (!open) return null;
  return (
    <Overlay onClick={onClose}>
      <ModalBox onClick={e => e.stopPropagation()}>
        {children}
      </ModalBox>
    </Overlay>
  );
};
