
import { FileText } from "lucide-react";

interface RequestNotesProps {
  notes?: string;
}

export const RequestNotes = ({ notes }: RequestNotesProps) => {
  if (!notes) return null;
  
  return (
    <div className="border-t pt-4">
      <h4 className="text-sm font-medium flex items-center mb-2">
        <FileText className="h-4 w-4 mr-2 text-gray-500" />
        Notes/Instructions
      </h4>
      <div className="bg-secondary/30 p-3 rounded-md whitespace-pre-wrap">
        {notes}
      </div>
    </div>
  );
};
