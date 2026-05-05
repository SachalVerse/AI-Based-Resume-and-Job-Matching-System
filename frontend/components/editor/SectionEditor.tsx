import React, { memo, useState } from "react";
import type { EditableFieldKey, EditableRightKey, FieldType, ResumeField, ResumeSection } from "@/types/types";

interface SectionEditorProps {
  section: ResumeSection;
  index: number;
  total: number;
  onUpdateTitle: (sectionId: string, title: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddField: (sectionId: string, type: FieldType) => void;
  onAddFieldsBatch: (sectionId: string, fields: Array<{ type: FieldType; value: string }>) => void;
  onRemoveField: (sectionId: string, fieldId: string) => void;
  onUpdateField: (sectionId: string, fieldId: string, key: EditableFieldKey, value: string) => void;
  onUpdateFieldRight: (sectionId: string, fieldId: string, key: EditableRightKey, value: string) => void;
  onMoveFieldUp: (sectionId: string, fieldId: string) => void;
  onMoveFieldDown: (sectionId: string, fieldId: string) => void;
  onMoveSectionUp: (sectionId: string) => void;
  onMoveSectionDown: (sectionId: string) => void;
}

export default memo(function SectionEditor({
  section,
  index,
  total,
  onUpdateTitle,
  onRemoveSection,
  onAddField,
  onRemoveField,
  onUpdateField,
  onUpdateFieldRight,
  onMoveFieldUp,
  onMoveFieldDown,
  onMoveSectionUp,
  onMoveSectionDown,
}: SectionEditorProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <div className="space-y-4 border-t border-gray-100 pt-6">
      <div className="flex justify-between items-center">
        <input
          value={section.title}
          onChange={(e) => onUpdateTitle(section.id, e.target.value)}
          placeholder="Section Title (e.g. Experience)"
          className="text-lg font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 w-full"
        />
        <div className="flex gap-2">
          <button onClick={() => onMoveSectionUp(section.id)} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-20 px-1">↑</button>
          <button onClick={() => onMoveSectionDown(section.id)} disabled={index === total - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-20 px-1">↓</button>
          <button 
            onClick={() => {
              if (isConfirmingDelete) onRemoveSection(section.id);
              else { setIsConfirmingDelete(true); setTimeout(() => setIsConfirmingDelete(false), 3000); }
            }} 
            className={`text-xs font-bold px-2 py-1 rounded ${isConfirmingDelete ? "bg-red-50 text-red-600" : "text-gray-300 hover:text-red-500"}`}
          >
            {isConfirmingDelete ? "Confirm?" : "Delete Section"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {section.fields.map((field, i) => (
          <div key={field.id} className="group relative border-b border-gray-50 pb-4 last:border-0">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <input
                  value={field.value}
                  onChange={(e) => onUpdateField(section.id, field.id, "value", e.target.value)}
                  placeholder={field.type === "heading" ? "Title..." : field.type === "bullet" ? "Action..." : "Content..."}
                  className={`w-full bg-transparent outline-none ${field.type === "heading" ? "font-bold text-gray-800" : "text-sm text-gray-600"}`}
                />
                
                {(field.type === "heading" || field.type === "text") && (
                  <div className="flex gap-2">
                    <input
                      value={field.right?.primary ?? ""}
                      onChange={(e) => onUpdateFieldRight(section.id, field.id, "primary", e.target.value)}
                      placeholder="Dates..."
                      className="w-1/2 text-xs border border-gray-100 rounded p-1"
                    />
                    <input
                      value={field.right?.secondary ?? ""}
                      onChange={(e) => onUpdateFieldRight(section.id, field.id, "secondary", e.target.value)}
                      placeholder="Location..."
                      className="w-1/2 text-xs border border-gray-100 rounded p-1"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onMoveFieldUp(section.id, field.id)} disabled={i === 0} className="text-xs text-gray-300 hover:text-gray-600">↑</button>
                <button onClick={() => onMoveFieldDown(section.id, field.id)} disabled={i === section.fields.length - 1} className="text-xs text-gray-300 hover:text-gray-600">↓</button>
                <button onClick={() => onRemoveField(section.id, field.id)} className="text-xs text-gray-300 hover:text-red-500">×</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {(["heading", "text", "bullet", "link", "divider"] as FieldType[]).map(type => (
          <button
            key={type}
            onClick={() => onAddField(section.id, type)}
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-gray-100"
          >
            + {type}
          </button>
        ))}
      </div>
    </div>
  );
});
