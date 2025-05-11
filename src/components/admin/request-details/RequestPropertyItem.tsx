
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface RequestPropertyItemProps {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  className?: string;
  colSpan?: boolean;
}

export const RequestPropertyItem = ({ 
  icon: Icon, 
  label, 
  value, 
  className = "",
  colSpan = false 
}: RequestPropertyItemProps) => {
  return (
    <div className={`space-y-2 ${colSpan ? 'col-span-2' : ''} ${className}`}>
      <h4 className="text-sm font-medium flex items-center">
        {Icon && <Icon className="h-4 w-4 mr-2 text-gray-500" />}
        {label}
      </h4>
      <div className={typeof value === 'string' ? '' : 'flex items-center gap-2'}>
        {value}
      </div>
    </div>
  );
};
