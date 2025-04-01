import { ChevronRight } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

export const Dropdown = ({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className="fixed mt-1 bg-white rounded-md shadow-lg z-50 min-w-[160px] py-1 border border-gray-100"
          style={{
            top: "auto",
            right: "1vw",
            width: "min-content",
            transform: "translateY(0)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Add a DropdownItem component for menu items
export const DropdownItem = ({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`w-full text-left px-4 py-2 text-sm hover:bg-olive-50 ${className}`}
  >
    {children}
  </button>
);

export const NestedDropdownItem = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: ({ className }: { className: string }) => ReactNode;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState("right");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Adjust position based on viewport
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      setPosition(rect.right > viewportWidth - 20 ? "left" : "right");
    }
  }, [isOpen]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen((prev) => !prev)} // Toggle on touch/click
      ref={menuRef}
    >
      <button className="w-full text-left px-4 py-2 text-sm hover:bg-olive-50 flex items-center justify-between">
        <div className="flex items-center">
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          {label}
        </div>
        <ChevronRight
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            position === "right" ? "left-full" : "right-full"
          } top-0 bg-white rounded-md shadow-lg z-50 min-w-[160px] py-1 border border-gray-100`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
