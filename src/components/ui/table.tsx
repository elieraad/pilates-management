import { ReactNode } from "react";

type TableProps = {
  headers: string[];
  children: ReactNode;
  className?: string;
};

export const Table = ({ headers, children, className = "" }: TableProps) => {
  return (
    <div className={`overflow-x-auto w-full ${className}`}>
      <table className="table-auto w-full min-w-max border-collapse">
        <thead>
          <tr className="text-left text-gray-500 text-sm border-b">
            {headers.map((header, index) => (
              <th
                key={index}
                className="pb-2 px-4 first:pl-4 last:pr-4 text-xs md:text-sm whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

type TableRowProps = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

export const TableRow = ({
  children,
  onClick,
  className = "",
}: TableRowProps) => {
  return (
    <tr
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

type TableCellProps = {
  children: ReactNode;
  className?: string;
};

export const TableCell = ({ children, className = "" }: TableCellProps) => {
  return (
    <td
      className={`py-3 px-4 first:pl-4 last:pr-4 text-xs md:text-sm break-words max-w-xs sm:max-w-none ${className}`}
    >
      {children}
    </td>
  );
};
