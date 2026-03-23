import { createContext, useState } from "react";

export const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
	const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const showAlert = (status: boolean = false, msg: string) => {
    setIsSuccess(status);
    setMessage(msg);
    setIsOpen(true);
  };

  const closeAlert = () => setIsOpen(false);

  return (
    <AlertContext.Provider value={{ isOpen, isSuccess, message, showAlert, closeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};
