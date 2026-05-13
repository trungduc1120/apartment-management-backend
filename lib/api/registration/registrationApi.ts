import { apiRequest } from "@/lib/api/api"

export async function getTempResidents(token?: string) {
  return apiRequest(`/registration/tem-resident`, "GET", undefined, token)
}

export async function getTempAbsents(token?: string) {
  return apiRequest(`/registration/tem-absent`, "GET", undefined, token)
}

export async function createTempResidentFirstTime(data: any, token?: string) {
  return apiRequest(`/registration/tem-resident-firsttime`, "POST", data, token)
}

export async function createTempResidentForExistingResident(residentId: number | string, data: any, token?: string) {
  return apiRequest(`/registration/tem-resident/${residentId}`, "POST", data, token)
}

export async function updateTempResidentRegistration(registrationId: number | string, data: any, token?: string) {
  return apiRequest(`/registration/tem-resident/${registrationId}`, "PATCH", data, token)
}

export async function deleteTempResidentRegis(registrationId: number, token?: string) {
  return apiRequest(`/registration/${registrationId}`, "DELETE", undefined, token)
}

export async function deleteTempResidentByTemRoute(registrationId: number, token?: string) {
  return apiRequest(`/registration/tem-resident/${registrationId}`, "DELETE", undefined, token)
}

export async function createTempAbsent(data: any, token?: string) {
  return apiRequest(`/registration/tem-absent`, "POST", data, token)
}

export async function updateTempAbsent(registrationId: number | string, data: any, token?: string) {
  return apiRequest(`/registration/tem-absent/${registrationId}`, "PATCH", data, token)
}

export async function deleteTempAbsent(registrationId: number | string, token?: string) {
  return apiRequest(`/registration/tem-absent/${registrationId}`, "DELETE", undefined, token)
}

// Admin endpoints
export async function adminGetPendingTempResidents(
  token?: string,
  opts?: { status?: string; page?: number; limit?: number; sortBy?: string; order?: string; keyword?: string }
) {
  // backend route: GET /registration/admin/tem-resident?page=&limit=&sortBy=&order=&status=&keyword=
  const params: string[] = []
  if (opts?.status) params.push(`status=${encodeURIComponent(opts.status)}`)
  if (opts?.page) params.push(`page=${encodeURIComponent(String(opts.page))}`)
  if (opts?.limit) params.push(`limit=${encodeURIComponent(String(opts.limit))}`)
  if (opts?.sortBy) params.push(`sortBy=${encodeURIComponent(opts.sortBy)}`)
  if (opts?.order) params.push(`order=${encodeURIComponent(opts.order)}`)
  if (opts?.keyword) params.push(`keyword=${encodeURIComponent(opts.keyword)}`)
  const q = params.length ? `?${params.join("&")}` : ""
  return apiRequest(`/registration/admin/tem-resident${q}`, "GET", undefined, token)
}

export async function adminGetTempResidentDetail(registrationId: number | string, token?: string) {
  return apiRequest(`/registration/admin/tem-resident/${registrationId}`, "GET", undefined, token)
}

export async function adminApproveTempResident(registrationId: number | string, token?: string) {
  // New backend expects POST /registration/admin/tem-resident/approve/:registrationId with body { informationStatus }
  return apiRequest(`/registration/admin/tem-resident/approve/${registrationId}`, "POST", { informationStatus: "APPROVED" }, token)
}

export async function adminRejectTempResident(registrationId: number | string, reason: string, token?: string) {
  // Use the same endpoint to update status to REJECTED and pass rejectReason
  return apiRequest(`/registration/admin/tem-resident/approve/${registrationId}`, "POST", { informationStatus: "REJECTED", rejectReason: reason }, token)
}

// Admin temp-absent endpoints
export async function adminGetPendingTempAbsents(
  token?: string,
  opts?: { status?: string; page?: number; limit?: number; sortBy?: string; order?: string; keyword?: string }
) {
  const params: string[] = []
  if (opts?.status) params.push(`status=${encodeURIComponent(opts.status)}`)
  if (opts?.page) params.push(`page=${encodeURIComponent(String(opts.page))}`)
  if (opts?.limit) params.push(`limit=${encodeURIComponent(String(opts.limit))}`)
  if (opts?.sortBy) params.push(`sortBy=${encodeURIComponent(opts.sortBy)}`)
  if (opts?.order) params.push(`order=${encodeURIComponent(opts.order)}`)
  if (opts?.keyword) params.push(`keyword=${encodeURIComponent(opts.keyword)}`)
  const q = params.length ? `?${params.join("&")}` : ""
  return apiRequest(`/registration/admin/tem-absent${q}`, "GET", undefined, token)
}

export async function adminGetTempAbsentDetail(registrationId: number | string, token?: string) {
  return apiRequest(`/registration/admin/tem-absent/${registrationId}`, "GET", undefined, token)
}

export async function adminApproveTempAbsent(registrationId: number | string, token?: string) {
  return apiRequest(`/registration/admin/tem-absent/approve/${registrationId}`, "POST", { informationStatus: "APPROVED" }, token)
}

export async function adminRejectTempAbsent(registrationId: number | string, reason: string, token?: string) {
  return apiRequest(`/registration/admin/tem-absent/approve/${registrationId}`, "POST", { informationStatus: "REJECTED", rejectReason: reason }, token)
}
