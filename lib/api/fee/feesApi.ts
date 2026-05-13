import { apiRequest } from "@/lib/api/api";

export interface Fee {
  id: number;
  name: string;
  description?: string;
  type: string;
  frequency: string;
  ratePerPerson: number;
  minium?: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
export interface FeeParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const feesApi = {
  getFees(params?: FeeParams, token?: string): Promise<PaginatedResponse<Fee>> {
   const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);

    return apiRequest(`/fee?${query.toString()}`, "GET", undefined, token);
  },

  createFee(data: any, token?: string): Promise<Fee> {
    return apiRequest("/fee", "POST", data, token);
  },

  updateFee(id: number, data: any, token?: string): Promise<Fee> {
    return apiRequest(`/fee/${id}`, "PATCH", data, token);
  },

  deleteFee(id: number, token?: string): Promise<void> {
    return apiRequest(`/fee/${id}`, "DELETE", undefined, token);
  },
};
