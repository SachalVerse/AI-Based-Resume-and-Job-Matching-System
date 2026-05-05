export type FieldType = "heading" | "text" | "bullet" | "link" | "divider";

export interface FieldRight {
  primary?: string;
  secondary?: string;
}

export interface ResumeField {
  id: string;
  type: FieldType;
  value: string;
  subtitle?: string;
  url?: string;
  right?: FieldRight;
}

export interface ContactItem {
  id: string;
  value: string;
  url?: string;
}

export interface ResumeSection {
  id: string;
  title: string;
  fields: ResumeField[];
}

export interface ResumeData {
  name: string;
  subtitle?: string;
  contact: ContactItem[];
  sections: ResumeSection[];
}
