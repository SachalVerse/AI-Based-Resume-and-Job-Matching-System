import React from "react";

export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-text-muted mb-2 mt-0">
      {children}
    </p>
  );
}
