import React, { memo } from "react";

interface HeaderEditorProps {
  name: string;
  contact: Array<{ id: string; value: string; url?: string }>;
  onNameChange: (name: string) => void;
  onAddContact: () => void;
  onRemoveContact: (id: string) => void;
  onUpdateContact: (id: string, key: "value" | "url", value: string) => void;
}

export default memo(function HeaderEditor({
  name,
  contact,
  onNameChange,
  onAddContact,
  onRemoveContact,
  onUpdateContact,
}: HeaderEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-500 uppercase">Full Name</label>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Jane Doe"
          className="w-full border border-gray-200 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Contact Links</label>
          <button onClick={onAddContact} className="text-xs text-blue-600 font-bold hover:underline">
            + Add Link
          </button>
        </div>
        
        <div className="space-y-3">
          {contact.map((c) => (
            <div key={c.id} className="flex gap-2 group">
              <input
                value={c.value}
                onChange={(e) => onUpdateContact(c.id, "value", e.target.value)}
                placeholder="Label (e.g. Email)"
                className="w-1/3 border border-gray-200 rounded p-2 text-sm"
              />
              <input
                value={c.url ?? ""}
                onChange={(e) => onUpdateContact(c.id, "url", e.target.value)}
                placeholder="URL / Info"
                className="flex-1 border border-gray-200 rounded p-2 text-sm"
              />
              <button 
                onClick={() => onRemoveContact(c.id)}
                className="text-gray-300 hover:text-red-500 px-2"
              >
                ×
              </button>
            </div>
          ))}
          {contact.length === 0 && (
            <p className="text-sm text-gray-400 italic">No links added.</p>
          )}
        </div>
      </div>
    </div>
  );
});
