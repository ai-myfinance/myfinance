'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type MenuTypeContextType = {
  currentMenuType: string | null;
  setCurrentMenuType: (type: string) => void;
  availableMenuTypes: { code: string; codeName: string }[];
  isLoading: boolean;
};

const MenuTypeContext = createContext<MenuTypeContextType | undefined>(undefined);

export function MenuTypeProvider({ children }: { children: ReactNode }) {
  const [currentMenuType, setCurrentMenuType] = useState<string | null>(null);
  const [availableMenuTypes, setAvailableMenuTypes] = useState<{ code: string; codeName: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 메뉴 타입 로드
    fetch('/api/code?masterCode=MENU_TYPE')
      .then((res) => res.json())
      .then((data) => {
        setAvailableMenuTypes(data);
        // 초기값이 없으면 첫 번째 타입으로 설정
        if (!currentMenuType && data.length > 0) {
          setCurrentMenuType(data[0].code);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch menu types:', error);
        setIsLoading(false);
      });
  }, [currentMenuType]);

  return (
    <MenuTypeContext.Provider value={{ currentMenuType, setCurrentMenuType, availableMenuTypes, isLoading }}>
      {children}
    </MenuTypeContext.Provider>
  );
}

export function useMenuType() {
  const context = useContext(MenuTypeContext);
  if (!context) {
    throw new Error('useMenuType must be used within MenuTypeProvider');
  }
  return context;
}