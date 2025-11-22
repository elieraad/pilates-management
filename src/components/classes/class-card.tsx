import Button from "@/components/ui/button";
import { Class } from "@/types/class.types";
import { Edit, Trash2 } from "lucide-react";

type ClassCardProps = {
  cls: Class;
  onAddClass: (cls: Class) => void;
  onEditClass: (cls: Class) => void;
  onDeleteClass: (cls: Class) => void;
};

export const ClassCard = ({
  cls,
  onAddClass,
  onEditClass,
  onDeleteClass,
}: ClassCardProps) => {
  return (
    <div className="bg-olive-50 p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-olive-900 text-sm md:text-base">
          {cls.name}
        </h3>
        <p className="text-xs md:text-sm text-gray-600">
          Instructor: {cls.instructor} | Duration: {cls.duration} min |
          Capacity: {cls.capacity} | Price: ${cls.price}
        </p>
        {cls.description && (
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            {cls.description}
          </p>
        )}
      </div>

      <div className="flex space-x-2 mt-3 sm:mt-0">
        <Button variant="secondary" size="sm" onClick={() => onAddClass(cls)}>
          Add Session
        </Button>

        <Button
          variant="outline"
          size="sm"
          icon={Edit}
          onClick={() => onEditClass(cls)}
        >
          Edit
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
          icon={Trash2}
          onClick={() => onDeleteClass(cls)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
