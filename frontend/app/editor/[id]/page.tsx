"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import EditorPanel from "@/components/editor/EditorPanel";
import { useResumeData } from "@/hooks/useResumeData";
import { useDebounce } from "@/hooks/useDebounce";
import { getEditorBackNav } from "@/lib/editorNavigation";

// PDFViewer is a browser-only API — must skip SSR
const PreviewPanel = dynamic(
  () => import("@/components/preview/PreviewPanel"),
  { ssr: false },
);

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id || "default";
  const { backHref, backLabel } = getEditorBackNav(searchParams);

  const resumeHook = useResumeData(id);

  // Debounce PDF data so the editor stays responsive and PDFViewer doesn't flicker on every keystroke
  const debouncedData = useDebounce(resumeHook.data, 800);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "sans-serif" }}>
      <EditorPanel resumeHook={resumeHook} backHref={backHref} backLabel={backLabel} />
      <PreviewPanel data={debouncedData} />
    </div>
  );
}
