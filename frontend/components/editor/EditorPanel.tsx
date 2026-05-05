import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeaderEditor from "./HeaderEditor";
import SectionEditor from "./SectionEditor";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { UseResumeDataReturn } from "@/hooks/useResumeData";

interface EditorPanelProps {
  resumeHook: UseResumeDataReturn;
  backHref?: string;
  backLabel?: string;
}

export default function EditorPanel({
  resumeHook,
  backHref = "/student/dashboard",
  backLabel = "Dashboard",
}: EditorPanelProps) {
  const router = useRouter();
  const [isConfirmingLoad, setIsConfirmingLoad] = useState(false);
  const {
    data,
    setName,
    addContact,
    removeContact,
    updateContact,
    addSection,
    removeSection,
    updateSectionTitle,
    moveSectionUp,
    moveSectionDown,
    addField,
    addFieldsBatch,
    removeField,
    updateField,
    updateFieldRight,
    moveFieldUp,
    moveFieldDown,
    loadTemplate
  } = resumeHook;

  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 1 + data.sections.length;

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const currentSection = currentStep === 0 ? null : data.sections[currentStep - 1];

  return (
    <div className="w-[45%] min-w-[360px] h-full bg-white border-r border-gray-200 overflow-y-auto p-6 flex flex-col relative">
      {/* Navigation */}
      <div className="mb-6">
        <Link href={backHref} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back to {backLabel}
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Resume Editor</h1>
          <p className="text-xs text-gray-500">Step {currentStep + 1} of {totalSteps}</p>
        </div>
        <button
          onClick={() => {
            if (isConfirmingLoad) {
              loadTemplate();
              setIsConfirmingLoad(false);
            } else {
              setIsConfirmingLoad(true);
              setTimeout(() => setIsConfirmingLoad(false), 3000);
            }
          }}
          className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors ${
            isConfirmingLoad ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
          }`}
        >
          {isConfirmingLoad ? "Click again to confirm" : "Load Template"}
        </button>
      </div>

      {/* Steps Indicator */}
      <div className="flex gap-1 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div 
            key={i} 
            className={`h-1 flex-1 rounded-full ${i <= currentStep ? "bg-blue-600" : "bg-gray-100"}`}
          />
        ))}
      </div>

      <div className="flex-1 pb-20">
        {currentStep === 0 ? (
          <HeaderEditor
            name={data.name}
            contact={data.contact}
            onNameChange={setName}
            onAddContact={addContact}
            onRemoveContact={removeContact}
            onUpdateContact={updateContact}
          />
        ) : (
          currentSection && (
            <SectionEditor
              key={currentSection.id}
              section={currentSection}
              index={currentStep - 1}
              total={data.sections.length}
              onUpdateTitle={updateSectionTitle}
              onRemoveSection={removeSection}
              onAddField={addField}
              onAddFieldsBatch={addFieldsBatch}
              onRemoveField={removeField}
              onUpdateField={updateField}
              onUpdateFieldRight={updateFieldRight}
              onMoveFieldUp={moveFieldUp}
              onMoveFieldDown={moveFieldDown}
              onMoveSectionUp={moveSectionUp}
              onMoveSectionDown={moveSectionDown}
            />
          )
        )}
      </div>

      {/* Footer Nav */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between bg-white sticky bottom-0">
        <button 
          onClick={prevStep} 
          disabled={currentStep === 0} 
          className="btn-secondary text-sm disabled:opacity-30"
        >
          Back
        </button>
        <div className="flex gap-2">
           {data.tailoredFor && (
             <button onClick={() => alert("Application Sent!")} className="btn-primary bg-green-600 hover:bg-green-700">
               Apply Now
             </button>
           )}
           <button 
             onClick={() => {
               if (currentStep === totalSteps - 1) {
                 router.push(backHref);
               } else {
                 nextStep();
               }
             }} 
             className="btn-primary"
           >
             {currentStep === totalSteps - 1 ? "Done" : "Next"}
           </button>
        </div>
      </div>
    </div>
  );
}
