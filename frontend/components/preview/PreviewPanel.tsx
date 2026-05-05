"use client";

import React, { memo } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import PDFResume from "@/components/pdf/PDFResume";
import type { ResumeData } from "@/types/types";

interface PreviewPanelProps {
  data: ResumeData;
}

export default memo(function PreviewPanel({ data }: PreviewPanelProps) {
  if (!data || !data.sections) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8 text-gray-400">
        Preparing preview...
      </div>
    );
  }

  return (
    <div className="flex-1 bg-app flex items-center justify-center p-8">
      <PDFViewer className="w-full h-full rounded-xl shadow-2xl border border-border-strong">
        <PDFResume data={data} />
      </PDFViewer>
    </div>
  );
});
