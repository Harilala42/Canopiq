import { useContext, JSX } from "react";
import { LuX } from "react-icons/lu";
import { Dialog, IconButton } from "@chakra-ui/react";
import { AlertContext } from "@/contexts/alertContext";

export const Alert = (): JSX.Element => {
	const { isOpen, isSuccess, message, closeAlert } = useContext(AlertContext);

	return (
		<Dialog.Root 
			open={isOpen} 
			onOpenChange={(details) => !details.open && closeAlert()}
		>
			<Dialog.Positioner>
				<Dialog.Content 
					py={4} w="80vw"
					bg={isSuccess ? "primary" : "red.500"}
				>
					<Dialog.CloseTrigger asChild>
						<IconButton 
							bg="transparent" color="white" 
							aria-label="Button Close Alert"
						>
							<LuX />
						</IconButton>
					</Dialog.CloseTrigger>
					<Dialog.Header className="title-styles">
						<Dialog.Title>{isSuccess ? 'All good!' : 'Oops!'}</Dialog.Title>
					</Dialog.Header>
					<Dialog.Body className="text-styles" fontWeight="500">{ message }</Dialog.Body>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
};