"use client";

import { useReducer, useCallback, useEffect, useState } from "react";
import { uid } from "@/lib/utils";
import type {
  ContactItem,
  EditableContactKey,
  EditableFieldKey,
  EditableRightKey,
  FieldType,
  ResumeData,
  ResumeSection,
} from "@/types/types";
import api from "@/lib/api";
import { useSession } from "next-auth/react";


export function getDefaultData(): ResumeData {
  let onboardingData: any = null;
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("user_profile_")) {
        onboardingData = JSON.parse(localStorage.getItem(key) || "null");
        break;
      }
    }
  }

  const name = onboardingData?.personal?.name || "Jake Ryan";
  const phone = onboardingData?.personal?.phone || "123-456-7890";
  const location = onboardingData?.personal?.location || "Georgetown, TX";
  const linkedin = onboardingData?.personal?.linkedin || "linkedin.com/in/jake";
  const github = onboardingData?.personal?.github || "github.com/jake";

  const degree = onboardingData?.education?.degree || "Bachelor of Arts in Computer Science";
  const school = onboardingData?.education?.school || "Southwestern University";
  const year = onboardingData?.education?.year || "2021";

  const expTitle = onboardingData?.experience?.title || "Software Engineer";
  const expCompany = onboardingData?.experience?.company || "Tech Corp";
  const expDuration = onboardingData?.experience?.duration || "2021 - Present";
  const expDesc = onboardingData?.experience?.description || "Worked on various full-stack projects.";

  const skills = onboardingData?.skills?.join(", ") || "React, Node.js, Python";

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    name: name,
    contact: [
      { id: uid(), value: phone },
      { id: uid(), value: "email@example.com" }, // Default email
      { id: uid(), value: linkedin, url: linkedin.startsWith("http") ? linkedin : `https://${linkedin}` },
      { id: uid(), value: github, url: github.startsWith("http") ? github : `https://${github}` },
    ],
    sections: [
      {
        id: uid(),
        title: "Education",
        fields: [
          {
            id: uid(), type: "heading", value: school,
            right: { primary: `Graduated ${year}`, secondary: location },
          },
          {
            id: uid(), type: "text", value: degree,
          },
        ],
      },
      {
        id: uid(),
        title: "Experience",
        fields: [
          {
            id: uid(), type: "heading", value: expTitle,
            right: { primary: expDuration },
          },
          {
            id: uid(), type: "text", value: expCompany,
          },
          ...expDesc.split(".").filter((s: string) => s.trim()).map((s: string) => ({
             id: uid(), type: "bullet" as const, value: s.trim()
          })),
        ],
      },
      {
        id: uid(),
        title: "Technical Skills",
        fields: [
          { id: uid(), type: "text", value: `Skills: ${skills}` },
        ],
      },
    ],
  };
}



const getStorageKey = (id: string) => `resume-builder-data-${id}`;

function loadFromStorage(id: string): ResumeData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return null;
    return parsed as ResumeData;
  } catch {
    return null;
  }
}

function saveToStorage(id: string, data: ResumeData): void {
  if (typeof window === "undefined") return;
  try {
    const toSave: ResumeData = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(getStorageKey(id), JSON.stringify(toSave));
  } catch {
    // localStorage may be full or disabled — fail silently
  }
}

// ── Reducer ───────────────────────────────────────────

type Action =
  | { type: "SET_NAME"; name: string }
  | { type: "ADD_CONTACT" }
  | { type: "REMOVE_CONTACT"; id: string }
  | { type: "UPDATE_CONTACT"; id: string; key: EditableContactKey; value: string }
  | { type: "ADD_SECTION" }
  | { type: "REMOVE_SECTION"; sectionId: string }
  | { type: "UPDATE_SECTION_TITLE"; sectionId: string; title: string }
  | { type: "MOVE_SECTION"; sectionId: string; direction: "up" | "down" }
  | { type: "ADD_FIELD"; sectionId: string; fieldType: FieldType }
  | { type: "ADD_FIELDS_BATCH"; sectionId: string; fields: Array<{ type: FieldType; value: string }> }
  | { type: "REMOVE_FIELD"; sectionId: string; fieldId: string }
  | { type: "UPDATE_FIELD"; sectionId: string; fieldId: string; key: EditableFieldKey; value: string }
  | { type: "UPDATE_FIELD_RIGHT"; sectionId: string; fieldId: string; key: EditableRightKey; value: string }
  | { type: "MOVE_FIELD"; sectionId: string; fieldId: string; direction: "up" | "down" }
  | { type: "HYDRATE"; data: ResumeData };

function swap<T>(arr: T[], i: number, j: number): T[] {
  if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

function mapSections(
  state: ResumeData,
  sectionId: string,
  fn: (s: ResumeSection) => ResumeSection,
): ResumeData {
  return { ...state, sections: state.sections.map((s) => (s.id === sectionId ? fn(s) : s)) };
}

function reducer(state: ResumeData, action: Action): ResumeData {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.name };

    case "ADD_CONTACT":
      return { ...state, contact: [...state.contact, { id: uid(), value: "" }] };

    case "REMOVE_CONTACT":
      return { ...state, contact: state.contact.filter((c) => c.id !== action.id) };

    case "UPDATE_CONTACT":
      return {
        ...state,
        contact: state.contact.map((c) =>
          c.id === action.id ? { ...c, [action.key]: action.value } : c,
        ),
      };

    case "ADD_SECTION":
      return {
        ...state,
        sections: [...state.sections, { id: uid(), title: "", fields: [] }],
      };

    case "REMOVE_SECTION":
      return { ...state, sections: state.sections.filter((s) => s.id !== action.sectionId) };

    case "UPDATE_SECTION_TITLE":
      return mapSections(state, action.sectionId, (s) => ({ ...s, title: action.title }));

    case "MOVE_SECTION": {
      const idx = state.sections.findIndex((s) => s.id === action.sectionId);
      const target = action.direction === "up" ? idx - 1 : idx + 1;
      return { ...state, sections: swap(state.sections, idx, target) };
    }

    case "ADD_FIELD":
      return mapSections(state, action.sectionId, (s) => ({
        ...s,
        fields: [
          ...s.fields,
          {
            id: uid(),
            type: action.fieldType,
            value: "",
            ...(action.fieldType === "link" ? { url: "" } : {}),
            // heading and text fields get a right object by default
            ...((action.fieldType === "heading" || action.fieldType === "text")
              ? { right: { primary: "", secondary: "" } }
              : {}),
          },
        ],
      }));

    case "ADD_FIELDS_BATCH":
      return mapSections(state, action.sectionId, (s) => ({
        ...s,
        fields: [
          ...s.fields,
          ...action.fields.map((f) => ({
            id: uid(),
            type: f.type,
            value: f.value,
            ...(f.type === "link" ? { url: "" } : {}),
            ...((f.type === "heading" || f.type === "text")
              ? { right: { primary: "", secondary: "" } }
              : {}),
          })),
        ],
      }));

    case "REMOVE_FIELD":
      return mapSections(state, action.sectionId, (s) => ({
        ...s,
        fields: s.fields.filter((f) => f.id !== action.fieldId),
      }));

    case "UPDATE_FIELD":
      return mapSections(state, action.sectionId, (s) => ({
        ...s,
        fields: s.fields.map((f) =>
          f.id === action.fieldId ? { ...f, [action.key]: action.value } : f,
        ),
      }));

    case "UPDATE_FIELD_RIGHT":
      return mapSections(state, action.sectionId, (s) => ({
        ...s,
        fields: s.fields.map((f) =>
          f.id === action.fieldId
            ? { ...f, right: { ...f.right, [action.key]: action.value } }
            : f,
        ),
      }));

    case "MOVE_FIELD":
      return mapSections(state, action.sectionId, (s) => {
        const idx = s.fields.findIndex((f) => f.id === action.fieldId);
        const target = action.direction === "up" ? idx - 1 : idx + 1;
        return { ...s, fields: swap(s.fields, idx, target) };
      });

    case "HYDRATE":
      return action.data;

    default:
      return state;
  }
}


export interface UseResumeDataReturn {
  data: ResumeData;

  loadTemplate: () => void;
  setName: (name: string) => void;

  addContact: () => void;
  removeContact: (id: string) => void;
  updateContact: (id: string, key: EditableContactKey, value: string) => void;

  addSection: () => void;
  removeSection: (sectionId: string) => void;
  updateSectionTitle: (sectionId: string, title: string) => void;
  moveSectionUp: (sectionId: string) => void;
  moveSectionDown: (sectionId: string) => void;

  addField: (sectionId: string, type: FieldType) => void;
  addFieldsBatch: (sectionId: string, fields: Array<{ type: FieldType; value: string }>) => void;
  removeField: (sectionId: string, fieldId: string) => void;
  updateField: (sectionId: string, fieldId: string, key: EditableFieldKey, value: string) => void;
  updateFieldRight: (sectionId: string, fieldId: string, key: EditableRightKey, value: string) => void;
  moveFieldUp: (sectionId: string, fieldId: string) => void;
  moveFieldDown: (sectionId: string, fieldId: string) => void;
}

export function useResumeData(resumeId: string): UseResumeDataReturn {
  const { data: session } = useSession();
  const [data, dispatch] = useReducer(reducer, undefined, getDefaultData);
  const [hydrated, setHydrated] = useState(false);

  // Load saved data from backend or localStorage on mount
  useEffect(() => {
    async function init() {
      setHydrated(false);
      
      // 1. Try backend first if it's a known ID (not a temporary frontend UID)
      if (resumeId && resumeId.length > 10) {
        try {
          const res = await api.get(`/resumes/detail/${resumeId}`);
          if (res.data?.content) {
             dispatch({ type: "HYDRATE", data: res.data.content });
             setHydrated(true);
             return;
          }
        } catch (err: any) {
          // 404 is expected for locally created resumes that haven't synced yet
          if (err.response?.status !== 404) {
            console.error("Failed to load from backend:", err);
          }
        }
      }

      // 2. Fallback to localStorage
      const saved = loadFromStorage(resumeId);
      if (saved) {
        dispatch({ type: "HYDRATE", data: saved });
      } else {
        dispatch({ type: "HYDRATE", data: getDefaultData() });
      }
      setHydrated(true);
    }
    init();
  }, [resumeId]);

  // Persist to backend and localStorage on every change (Debounced)
  useEffect(() => {
    if (!hydrated) return;
    
    // Save to local immediately
    saveToStorage(resumeId, data);

    // Debounce backend save
    const timeout = setTimeout(async () => {
      try {
        const userEmail = session?.user?.email;
        if (!userEmail) return;

        const payload = {
          name: data.name,
          content: data,
          user_email: userEmail,
        };
        
        if (resumeId.length > 10) {
           await api.put(`/resumes/${resumeId}`, payload);
        } else {
           await api.post("/resumes/", payload);
        }
      } catch (err) {
        console.error("Sync error:", err);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [data, hydrated, resumeId]);

  // All callbacks are stable — they only capture `dispatch` (which is stable)
  const loadTemplate = useCallback(() => {
    dispatch({ type: "HYDRATE", data: getDefaultData() });
  }, []);

  const setName = useCallback(
    (name: string) => dispatch({ type: "SET_NAME", name }),
    [],
  );

  const addContact = useCallback(
    () => dispatch({ type: "ADD_CONTACT" }),
    [],
  );
  const removeContact = useCallback(
    (id: string) => dispatch({ type: "REMOVE_CONTACT", id }),
    [],
  );
  const updateContact = useCallback(
    (id: string, key: EditableContactKey, value: string) =>
      dispatch({ type: "UPDATE_CONTACT", id, key, value }),
    [],
  );

  const addSection = useCallback(
    () => dispatch({ type: "ADD_SECTION" }),
    [],
  );
  const removeSection = useCallback(
    (sectionId: string) => dispatch({ type: "REMOVE_SECTION", sectionId }),
    [],
  );
  const updateSectionTitle = useCallback(
    (sectionId: string, title: string) =>
      dispatch({ type: "UPDATE_SECTION_TITLE", sectionId, title }),
    [],
  );
  const moveSectionUp = useCallback(
    (sectionId: string) =>
      dispatch({ type: "MOVE_SECTION", sectionId, direction: "up" }),
    [],
  );
  const moveSectionDown = useCallback(
    (sectionId: string) =>
      dispatch({ type: "MOVE_SECTION", sectionId, direction: "down" }),
    [],
  );

  const addField = useCallback(
    (sectionId: string, type: FieldType) =>
      dispatch({ type: "ADD_FIELD", sectionId, fieldType: type }),
    [],
  );
  const addFieldsBatch = useCallback(
    (sectionId: string, fields: Array<{ type: FieldType; value: string }>) =>
      dispatch({ type: "ADD_FIELDS_BATCH", sectionId, fields }),
    [],
  );
  const removeField = useCallback(
    (sectionId: string, fieldId: string) =>
      dispatch({ type: "REMOVE_FIELD", sectionId, fieldId }),
    [],
  );
  const updateField = useCallback(
    (sectionId: string, fieldId: string, key: EditableFieldKey, value: string) =>
      dispatch({ type: "UPDATE_FIELD", sectionId, fieldId, key, value }),
    [],
  );
  const updateFieldRight = useCallback(
    (sectionId: string, fieldId: string, key: EditableRightKey, value: string) =>
      dispatch({ type: "UPDATE_FIELD_RIGHT", sectionId, fieldId, key, value }),
    [],
  );
  const moveFieldUp = useCallback(
    (sectionId: string, fieldId: string) =>
      dispatch({ type: "MOVE_FIELD", sectionId, fieldId, direction: "up" }),
    [],
  );
  const moveFieldDown = useCallback(
    (sectionId: string, fieldId: string) =>
      dispatch({ type: "MOVE_FIELD", sectionId, fieldId, direction: "down" }),
    [],
  );

  return {
    data,
    loadTemplate,
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
  };
}
