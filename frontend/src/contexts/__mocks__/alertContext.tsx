import React, { createContext } from 'react';

export const mockShowAlert = jest.fn();

export const AlertContext = createContext({
  showAlert: mockShowAlert,
});

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AlertContext.Provider value={{ showAlert: mockShowAlert }}>
      {children}
    </AlertContext.Provider>
  );
};
