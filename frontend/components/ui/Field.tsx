import React from "react";

export interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function Field({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="editor-input"
      />
    </div>
  );
}
