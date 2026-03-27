import { useContext, JSX } from "react";
import { LuX } from "react-icons/lu";
import { toaster } from "@/components/ui/toaster";
import { AlertContext } from "@/contexts/alertContext";

export const Alert = (): JSX.Element => {
	const { isOpen, isSuccess, message, closeAlert } = useContext(AlertContext);

	return (
		
	);
};