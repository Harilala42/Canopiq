import { memo } from "react";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { LuCirclePlus } from "react-icons/lu";

interface SideBarActionsProps
{
    isExpanded: boolean;
    isCreating: boolean;
    createNewQuery: () => void;
}

const SideBarActions = memo(({ 
    isExpanded,
    isCreating,
    createNewQuery
}: SideBarActionsProps) => {
    return isExpanded
        ? (
            <Button
                aria-label="Create new query"
                onClick={createNewQuery}
                disabled={isCreating}
            >
                <LuCirclePlus /> New Query
            </Button>
        ) : (
            <IconButton
                aria-label="Create new query"
                onClick={(e) => {
                e.stopPropagation();
                createNewQuery();
                }}
                disabled={isCreating}
            >
                <LuCirclePlus />
            </IconButton>
        );
});

export default SideBarActions;
