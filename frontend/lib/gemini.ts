/**
 * generateResumeContent — calls the server-side /api/gemini/generate route.
 * The Gemini SDK must NOT be called directly from the browser because
 * Google's API does not allow cross-origin requests (CORS / Network Error).
 */
export async function generateResumeContent(sectionTitle: string, currentContent: string = "") {
  const res = await fetch("/api/gemini/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sectionTitle, currentContent }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Failed to generate resume content.");
  }

  return res.json();
}
