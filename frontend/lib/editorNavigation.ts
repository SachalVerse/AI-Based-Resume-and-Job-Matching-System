import type { ReadonlyURLSearchParams } from "next/navigation";

/** Query key indicating the user opened the editor from the student app shell. */
export const EDITOR_FROM_QUERY = "from" as const;
export const EDITOR_FROM_STUDENT = "student" as const;

export function buildEditorUrl(resumeId: string, fromStudent: boolean): string {
  if (!fromStudent) return `/editor/${resumeId}`;
  const q = new URLSearchParams({ [EDITOR_FROM_QUERY]: EDITOR_FROM_STUDENT });
  return `/editor/${resumeId}?${q.toString()}`;
}

export function getEditorBackNav(
  searchParams: ReadonlyURLSearchParams | null,
): { backHref: string; backLabel: string } {
  if (searchParams?.get(EDITOR_FROM_QUERY) === EDITOR_FROM_STUDENT) {
    return { backHref: "/student/resume", backLabel: "Resume dashboard" };
  }
  return { backHref: "/dashboard", backLabel: "Dashboard" };
}
