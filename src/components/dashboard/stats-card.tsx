import { LucideIcon } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  className = "",
}: StatsCardProps) => {
  return (
    <div className={`bg-olive-50 p-4 rounded-lg ${className}`}>
      <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
      <div className="flex items-center">
        <Icon className="w-5 h-5 text-olive-600 mr-2" />
        <span className="text-2xl font-medium">{value}</span>
      </div>
    </div>
  );
};

export default StatsCard;
