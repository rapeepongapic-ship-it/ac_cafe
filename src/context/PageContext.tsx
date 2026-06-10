import React, { createContext, useContext } from 'react';

export const PAGE_REPORT = 0;
export const PAGE_SALES = 1;
export const PAGE_SETTINGS = 2;

interface PageContextValue {
  currentPage: number;
  navigateTo: (page: number) => void;
}

const PageContext = createContext<PageContextValue>({
  currentPage: 0,
  navigateTo: () => {},
});

export const usePage = () => useContext(PageContext);

export { PageContext };
