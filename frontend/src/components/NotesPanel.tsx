"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, FileText, Loader } from "lucide-react";

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conceptName: string;
  currentNotes: string;
  onSaveNotes: (conceptName: string, notes: string) => void;
  conceptDefinition?: string;
  loadingDefinition?: boolean;
}

export default function NotesPanel({
  isOpen,
  onClose,
  conceptName,
  currentNotes,
  onSaveNotes,
  conceptDefinition = "",
  loadingDefinition = false,
}: NotesPanelProps) {
  const [notes, setNotes] = useState(currentNotes);
  const [isSaving, setIsSaving] = useState(false);

  // Debug: log when props change
  useEffect(() => {
    console.log("NotesPanel props:", { conceptDefinition, loadingDefinition, conceptName });
  }, [conceptDefinition, loadingDefinition, conceptName]);

  // Update notes when concept changes
  useEffect(() => {
    setNotes(currentNotes);
  }, [currentNotes, conceptName]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveNotes(conceptName, notes);
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-200 bg-white rounded-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Notes for &ldquo;{conceptName}&rdquo;
              </h3>
              <p className="text-sm text-gray-600">
                Add your personal notes and annotations
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 overflow-auto" style={{ maxHeight: "calc(80vh - 180px)" }}>
          {/* Concept Definition Section - ALWAYS SHOW */}
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">📖 Concept Definition</h4>
            {loadingDefinition ? (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Loading definition...</span>
              </div>
            ) : conceptDefinition ? (
              <p className="text-sm text-gray-700 leading-relaxed">{conceptDefinition}</p>
            ) : (
              <p className="text-sm text-gray-500 italic">No definition available yet.</p>
            )}
          </div>

          {/* Your Notes Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">✍️ Your Notes</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your personal notes here... You can use markdown formatting."
              className="min-h-[200px] resize-none border-gray-200 focus:border-purple-500 bg-white text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="border-gray-200 text-gray-700 hover:bg-gray-50">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      </Card>
    </div>
  );
}