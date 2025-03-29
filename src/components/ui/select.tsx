import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  className?: string;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-gray-600 mb-1">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`appearance-none w-full p-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-200 ${
              error ? "border-red-300" : "border-gray-200"
            } ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
