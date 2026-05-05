// ── Field Types ───────────────────────────────────────
export type FieldType = "heading" | "text" | "bullet" | "link" | "divider";

// ── Right-side metadata (dates / location) ────────────
/**
 * Optional right-column data for two-column resume layout.
 * - primary   → dates or timeline (e.g. "June 2020 – Present")
 * - secondary → location or status (e.g. "London, UK")
 */
export interface FieldRight {
  primary?: string;
  secondary?: string;
}

export type EditableRightKey = keyof FieldRight;

/**
 * A single content field inside a resume section.
 * - heading → bold entry title (e.g. job title, school name)
 * - text    → normal body text (dates, descriptions)
 * - bullet  → bulleted list item
 * - link    → clickable anchor with display label + URL
 * - divider → visual spacer between entry groups
 *
 * `right` is optional — when present, the field renders in a
 * two-column layout with the right side showing dates/location.
 */
export interface ResumeField {
  readonly id: string;
  readonly type: FieldType;
  value: string;
  url?: string;         // only used when type === "link"
  right?: FieldRight;   // optional right-column metadata
}

// ── Editable keys (prevents mutation of id/type) ──────
export type EditableFieldKey = "value" | "url";
export type EditableContactKey = "value" | "url";

// ── Contact ───────────────────────────────────────────
/** A single item in the header contact bar (phone, email, link, etc.) */
export interface ContactItem {
  readonly id: string;
  value: string;
  url?: string;
}

// ── Section ───────────────────────────────────────────
/** A user-created section with a title and ordered list of fields. */
export interface ResumeSection {
  readonly id: string;
  title: string;
  fields: ResumeField[];
}

// ── Top-level Resume ──────────────────────────────────
export interface ResumeData {
  version: 1;
  name: string;
  contact: ContactItem[];
  sections: ResumeSection[];
  updatedAt: string;
  tailoredFor?: string;
}