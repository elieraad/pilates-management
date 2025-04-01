import { ReactNode } from "react";

export const ActionSheet = ({
  isOpen,
  onClose,
  actions,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    title: string;
    items: {
      onClick: () => void;
      icon: (x: object) => ReactNode;
      label: string;
      destructive?: boolean;
    }[];
  }[];
  title: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-xl max-h-[80vh] overflow-auto">
        <div className="p-4 border-b">
          <div className="w-12 h-1 bg-gray-300 rounded mx-auto mb-4" />
          <h3 className="text-center font-medium">{title}</h3>
        </div>

        {actions.map((group, i) => (
          <div key={i} className="p-4">
            {group.title && (
              <h4 className="text-sm text-gray-500 mb-2">{group.title}</h4>
            )}
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              {group.items.map((item, j) => (
                <button
                  key={j}
                  className="w-full py-4 px-4 text-left flex items-center border-b last:border-0 border-gray-100"
                  onClick={() => {
                    item.onClick();
                    onClose();
                  }}
                >
                  {item.icon && (
                    <span
                      className={`mr-3 ${
                        item.destructive ? "text-red-600" : "text-olive-600"
                      }`}
                    >
                      <item.icon />
                    </span>
                  )}
                  <span className={item.destructive ? "text-red-600" : ""}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="p-4">
          <button
            className="w-full py-4 bg-gray-100 rounded-xl font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
