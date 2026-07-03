import { getBrowserSafeUploadUrl } from "@/lib/api-base"
import { apiFetch } from "@/lib/api-client"

// Image Upload
export async function uploadImage(
  file: File,
  auth?: { userId: string; email?: string }
) {
  const formData = new FormData()
  formData.append("file", file)
  const headers: Record<string, string> = {}
  if (auth) {
    headers["X-User-Id"] = auth.userId
    if (auth.email) headers["X-User-Email"] = auth.email
  }
  const response = await apiFetch(getBrowserSafeUploadUrl(), {
    method: "POST",
    headers,
    body: formData,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const errPayload = body?.error
    const details = errPayload?.details?.length ? ": " + errPayload.details.join("; ") : ""
    throw new Error((errPayload?.message || "Erro no upload") + details)
  }
  return response.json() as Promise<{ data: { url: string; filename: string } }>
}
