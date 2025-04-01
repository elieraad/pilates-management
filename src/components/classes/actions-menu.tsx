import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { Dropdown, DropdownItem, NestedDropdownItem } from "../ui/dropdown";
import Button from "../ui/button";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { ClassSession } from "@/types/class.types";
import { ActionSheet } from "../ui/action-sheet";

export const ActionsMenu = ({
  session,
  handleModifyOccurrence,
  handleEditSeries,
  handleCancelOccurrence,
  handleDeleteSeries,
}: {
  session: ClassSession;
  handleModifyOccurrence: (s: ClassSession) => void;
  handleEditSeries: (s: ClassSession) => void;
  handleCancelOccurrence: (s: ClassSession) => void;
  handleDeleteSeries: (s: ClassSession) => void;
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const actions = [
    {
      title: "Edit",
      items: [
        {
          label: "Edit This Occurrence",
          icon: Edit,
          onClick: () => handleModifyOccurrence(session),
        },
        {
          label: "Edit Entire Series",
          icon: Edit,
          onClick: () => handleEditSeries(session),
        },
      ],
    },
    {
      title: "Delete",
      items: [
        {
          label: "Delete This Occurrence",
          icon: Trash2,
          onClick: () => handleCancelOccurrence(session),
          destructive: true,
        },
        {
          label: "Delete Entire Series",
          icon: Trash2,
          onClick: () => handleDeleteSeries(session),
          destructive: true,
        },
      ],
    },
  ];

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMobileMenu(true)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>

        <ActionSheet
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          actions={actions}
          title="Session Options"
        />
      </>
    );
  }

  // Desktop dropdown version
  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      }
    >
      <NestedDropdownItem label="Edit" icon={Edit}>
        {session.is_recurring && (
          <>
            <DropdownItem onClick={() => handleModifyOccurrence(session)}>
              This Occurrence
            </DropdownItem>
            <DropdownItem onClick={() => handleEditSeries(session)}>
              Entire Series
            </DropdownItem>
          </>
        )}
        {!session.is_recurring && (
          <DropdownItem onClick={() => handleModifyOccurrence(session)}>
            Edit Session
          </DropdownItem>
        )}
      </NestedDropdownItem>

      <NestedDropdownItem label="Delete" icon={Trash2}>
        {session.is_recurring && (
          <>
            <DropdownItem
              onClick={() => handleCancelOccurrence(session)}
              className="text-red-600"
            >
              This Occurrence
            </DropdownItem>
            <DropdownItem
              onClick={() => handleDeleteSeries(session)}
              className="text-red-600"
            >
              Entire Series
            </DropdownItem>
          </>
        )}
        {!session.is_recurring && (
          <DropdownItem
            onClick={() => handleCancelOccurrence(session)}
            className="text-red-600"
          >
            Delete Session
          </DropdownItem>
        )}
      </NestedDropdownItem>
    </Dropdown>
  );
};
