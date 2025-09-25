import { useState } from "react";
import { FileEdit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdminNotesProps {
  requestId: string;
  adminNotes?: string;
  onNotesUpdated: (newNotes: string) => void;
}

export const AdminNotes = ({ requestId, adminNotes, onNotesUpdated }: AdminNotesProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(adminNotes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('self_purchases')
        .update({ admin_notes: notes || null })
        .eq('id', requestId);

      if (error) throw error;

      onNotesUpdated(notes);
      setIsEditing(false);
      
      toast({
        title: "Notes Updated",
        description: "Admin notes have been saved successfully",
      });
    } catch (err: any) {
      console.error('Error updating admin notes:', err);
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(adminNotes || "");
    setIsEditing(false);
  };

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium flex items-center">
          <FileEdit className="h-4 w-4 mr-2 text-gray-500" />
          Admin Notes
        </h4>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 px-2"
          >
            <FileEdit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add admin notes for this request..."
            className="min-h-[100px] resize-none"
            maxLength={1000}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-secondary/30 p-3 rounded-md">
          {notes ? (
            <div className="whitespace-pre-wrap text-sm">{notes}</div>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              No admin notes added yet
            </div>
          )}
        </div>
      )}
    </div>
  );
};