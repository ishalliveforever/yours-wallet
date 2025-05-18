import { useBlockHeightTracker } from '../hooks/useBlockHeightTracker';
import { Show } from './Show';
import ProgressBar from '@ramonak/react-progress-bar';
import { useTheme } from '../hooks/useTheme';
import { styled } from 'styled-components';
import { WhiteLabelTheme } from '../theme.types';
import { YoursIcon } from './YoursIcon';

const FloatingContainer = styled.div<WhiteLabelTheme>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: ${({ theme }) => theme.color.global.walletBackground};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0.5rem 1rem;

  @media (max-width: 600px) {
    padding: 0.25rem 0.5rem;
  }
`;

const Title = styled.h1<WhiteLabelTheme>`
  text-align: center;
  width: 100%;
  color: ${({ theme }) => theme.color.global.contrast};
  margin: 1.5rem 0 1rem 0;
  font-size: 1.5rem;

  @media (max-width: 600px) {
    margin: 1rem 0 0.5rem 0;
    font-size: 1.15rem;
  }
`;

const Description = styled.p<WhiteLabelTheme>`
  text-align: center;
  width: 90%;
  margin: 0 0 1rem 0;
  color: ${({ theme }) => theme.color.global.gray};
  font-size: 1rem;

  @media (max-width: 600px) {
    font-size: 0.95rem;
    margin: 0 0 0.5rem 0;
  }
`;
