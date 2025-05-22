import { ReactNode, useEffect, useState } from 'react';
import { NetWork } from 'yours-wallet-provider';
import { BottomMenu } from '../../components/BottomMenu';
import { useTheme } from '../../hooks/useTheme';
import { BottomMenuContext, MenuItems } from '../BottomMenuContext';
import { useLocation } from 'react-router-dom';

interface BottomMenuProviderProps {
  network: NetWork;
  children: ReactNode;
}

export const BottomMenuProvider = (props: BottomMenuProviderProps) => {
  const { children, network } = props;
  const { theme } = useTheme();
  const location = useLocation();
  // Set default selected tab to 'bsv' so the wallet UI loads by default and the menu works
  const [selected, setSelected] = useState<MenuItems>('bsv');
  const [query, setQuery] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const handleSelect = (item: MenuItems, pageQuery?: string) => {
    setSelected(item);
    if (pageQuery) setQuery(pageQuery);
  };

  const showMenu = () => {
    setIsVisible(true);
  };

  const hideMenu = () => {
    setIsVisible(false);
  };

  // Sync selected tab with current route
  useEffect(() => {
    if (location.pathname.startsWith('/bsv-wallet')) setSelected('bsv');
    else if (location.pathname.startsWith('/ord-wallet')) setSelected('ords');
    else if (location.pathname.startsWith('/tools')) setSelected('tools');
    else if (location.pathname.startsWith('/settings')) setSelected('settings');
    else if (location.pathname.startsWith('/browser')) setSelected('browser');
    else setSelected('bsv');
  }, [location.pathname]);

  // Always show the bottom menu (not just when isVisible)
  return (
    <BottomMenuContext.Provider
      value={{
        selected,
        handleSelect,
        isVisible,
        showMenu,
        hideMenu,
        query,
      }}
    >
      <BottomMenu theme={theme} network={network} handleSelect={handleSelect} selected={selected} />
      {children}
    </BottomMenuContext.Provider>
  );
};
