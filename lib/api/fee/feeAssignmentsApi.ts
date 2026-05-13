import { apiRequest } from "@/lib/api/api";
import { Fee } from "./feesApi";

export interface CreateAssignmentDto {
  feeId: number;
  householdIds: number[];
  dueDate: string;
}
export interface Payment {
  id: number;
  feeAssignmentId: number;
  amountPaid: number;
  imageUrl: string;
  imagePath: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  paidDate: string;
  note?: string;
}

export interface FeeAssignmentItem {
  id: number;
  feeId: number;
  householdId: number;
  amountDue: number;
  dueDate: string;
  isPaid: boolean;
  paidDate: string | null;
  household?: {
    id: number;
    houseHoldCode: number;
    head?: { fullname: string };
  };
  fee?: Fee;
  Payment?: Payment;
}

export interface CreatePaymentPayload {
  feeAssignmentId: number;
  amountPaid: number;
  imageUrl: string;
  imagePath: string;
}
export interface FeeDetailParams {
  page?: number;
  limit?: number;
  isPaid?: string;
}

export const feeAssignmentsApi = {
  createAssignment(data: CreateAssignmentDto, token?: string): Promise<any> {
    return apiRequest("/fee/assign", "POST", data, token);
  },

 getFeeDetail(feeId: number, params?: FeeDetailParams, token?: string): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.isPaid) query.append("isPaid", params.isPaid);

    return apiRequest(`/fee/${feeId}/detail?${query.toString()}`, "GET", undefined, token);
  },

  getHouseholdFees(householdId: number, token?: string): Promise<any> {
    return apiRequest(`/fee/household/${householdId}`, "GET", undefined, token);
  },
  approvePayment(paymentId: number, token?: string): Promise<any> {
    return apiRequest(`/payments/${paymentId}/approve`, "PATCH", undefined, token);
  },

  rejectPayment(paymentId: number, note: string, token?: string): Promise<any> {
    return apiRequest(`/payments/${paymentId}/reject`, "PATCH", { note }, token);
  },

  uploadPaymentProof(file: File, token?: string): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }).then(res => res.json());
  },
  
  createPayment(data: CreatePaymentPayload, token?: string): Promise<any> {
    return apiRequest("/payments", "POST", data, token);
  },
};