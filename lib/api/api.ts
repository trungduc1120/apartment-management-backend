export const API_URL =
  process.env.NEXT_PUBLIC_API_URL 

export async function apiRequest(
  url: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  data?: any,
  token?: string
) {
  const headers: Record<string, string> = {};
  
  // Only set Content-Type for non-FormData requests
  const isFormData = data instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const options: RequestInit = {
    method,
    headers,
    credentials: "include",
  };
  
  if (data && method !== "GET") {
    options.body = isFormData ? data : JSON.stringify(data);
  }

  const res = await fetch(`${API_URL}${url}`, options);
  let json: any = null
  try {
    json = await res.json()
  } catch (err) {
    // ignore json parse errors
  }

  if (!res.ok) {
    if (res.status === 401) {
      const res = await fetch(`${API_URL}/auth/refresh`)
      console.log(res)
      const message = (json && (json.message || json.error)) || "Không có quyền (401). Vui lòng đăng nhập lại."
      throw new Error(message)
    }
    const message = (json && (json.message || json.error)) || "Yêu cầu thất bại"
    throw new Error(message)
  }

  return json
}

export async function postJSON(url: string, data: any) {
  return apiRequest(url, "POST", data);
}

export async function createHouseholdAndHead(data: any, token?: string) {
  return apiRequest("/house-hold", "POST", data, token);
}

export async function getHouseholdInfo(token?: string) {  
  return apiRequest("/house-hold", "GET", undefined, token);
}

export async function getHouseholdMembers(token?: string) {
  return apiRequest("/house-hold/member", "GET", undefined, token);
}

export async function addHouseholdMember(data: any, token?: string) {
  return apiRequest("/house-hold/addmember", "POST", data, token);
}

export async function updateHouseHoldMember(residentId: number, data: any, token?: string) {
  return apiRequest(`/house-hold/member/${residentId}`, "PATCH", data, token);
}

export async function deleteHouseHoldMember(residentId: number, token?: string) {
  return apiRequest(`/house-hold/member/${residentId}`, "DELETE", undefined, token);
}

export async function updateHouseHoldInfo(data: any, token?: string) {
  return apiRequest("/house-hold/update", "PATCH", data, token);
}


export async function adminGetAllHouseholds(
  token?: string, 
  params?: { page?: number; limit?: number; search?: string }
) { 
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.search) query.append("search", params.search);

  const url = `/admin?${query.toString()}`;
  return apiRequest(url, "GET", undefined, token); 
}

export async function getAdminDashboardStats(token?: string) {
  return apiRequest("/admin/dashboard/stats", "GET", undefined, token);
}

export async function createTempResidentRegis(data: any, token?: string){
  return apiRequest("/registration", "POST", data, token);
}

export async function getTempResidents(token?: string) {
  return apiRequest("/registration/tem-resident", "GET", undefined, token);
}

export async function deleteTempResidentRegis(registrationId: number, token?: string) {
  return apiRequest(`/registration/${registrationId}`, "DELETE", undefined, token);
}

// Delete temp-resident using the tem-resident route (used in some flows)
export async function deleteTempResidentByTemRoute(registrationId: number, token?: string) {
  const url = `/registration/tem-resident/${registrationId}`
  console.log(`[API] DELETE ${url}`)
  return apiRequest(url, "DELETE", undefined, token);
}

export async function getResidentByNationalId(nationalId: string, token?: string) {
  // Use household temp resident lookup as provided by backend
  const url = `/house-hold/temp-resident/${encodeURIComponent(nationalId)}`
  console.log(`[API] GET ${url} with nationalId="${nationalId}"`)
  return apiRequest(url, "GET", undefined, token);
}

// If resident not found, frontend should POST all resident fields + registration details
// to this endpoint to create a temp resident registration in one step.
export async function createTempResidentFirstTime(data: any, token?: string) {
  return apiRequest(`/registration/tem-resident-firsttime`, "POST", data, token);
}

// If resident exists, call this endpoint with residentId and registration payload
export async function createTempResidentForExistingResident(residentId: number | string, data: any, token?: string) {
  return apiRequest(`/registration/tem-resident/${residentId}`, "POST", data, token);
}

export async function updateTempResidentRegistration(registrationId: number | string, data: any, token?: string) {
  const url = `/registration/tem-resident/${registrationId}`
  console.log(`[API] PATCH ${url}`)
  return apiRequest(url, "PATCH", data, token)
}

export async function getTempAbsents(token?: string) {
  return apiRequest(`/registration/tem-absent`, "GET", undefined, token)
}

export async function createTempAbsent(data: any, token?: string) {
  return apiRequest(`/registration/tem-absent`, "POST", data, token)
}

export async function deleteTempAbsent(registrationId: number | string, token?: string) {
  const url = `/registration/tem-absent/${registrationId}`
  console.log(`[API] DELETE ${url}`)
  return apiRequest(url, "DELETE", undefined, token)
}

export async function updateTempAbsent(registrationId: number | string, data: any, token?: string) {
  const url = `/registration/tem-absent/${registrationId}`
  console.log(`[API] PATCH ${url}`)
  return apiRequest(url, "PATCH", data, token)
}

