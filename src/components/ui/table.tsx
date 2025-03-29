import { ReactNode } from "react";

type TableProps = {
  headers: string[];
  children: ReactNode;
  className?: string;
};

export const Table = ({ headers, children, className = "" }: TableProps) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-full">
        <thead>
          <tr className="text-left text-gray-500 text-sm border-b">
            {headers.map((header, index) => (
              <th key={index} className="pb-2 pl-4 first:pl-4 last:pr-4">
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
      className={`border-b border-gray-100 hover:bg-olive-50 ${
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
    <td className={`py-3 first:pl-4 last:pr-4 ${className}`}>{children}</td>
  );
};
