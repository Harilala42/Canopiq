import { createContext } from "react";
import { toaster } from "@/components/ui/toaster";

export const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const showAlert = (status: boolean = false, msg: string) => {
      toaster.create({
        title: msg,
        type: status ? "success" : "error",
        duration: 5000
      });
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
    </AlertContext.Provider>
  );
};
