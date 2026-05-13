"use client"
import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { feesApi, type Fee, type FeeParams } from "@/lib/api/fee/feesApi"
import { feeAssignmentsApi, FeeAssignmentItem, CreateAssignmentDto } from "@/lib/api/fee/feeAssignmentsApi"
import { useAuth } from "./auth-context"
import { toast } from "sonner"
import { CreatePaymentPayload } from "@/lib/api/fee/feeAssignmentsApi"

interface FeeContextType {
  fees: Fee[]
  feesLoading: boolean
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  loadFees: (param?: FeeParams) => Promise<void>
  createFee: (data: Parameters<typeof feesApi.createFee>[0]) => Promise<void>
  updateFee: (id: number, data: Parameters<typeof feesApi.updateFee>[1]) => Promise<void>
  deleteFee: (id: number) => Promise<void>

  createAssignment: (data: CreateAssignmentDto) => Promise<void>
  
  getFeeDetail: (feeId: number, params?: any) => Promise<any>
  getHouseholdFees: (householdId: number) => Promise<FeeAssignmentItem[]>

  approvePayment:(paymentId: number) => Promise<void>
  rejectPayment: (paymentId: number, note: string) => Promise<void>

  submitPayment: (feeAssignmentId: number, amount: number, file: File) => Promise<void>
}

const FeeContext = createContext<FeeContextType | undefined>(undefined)

export function FeeProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [fees, setFees] = useState<Fee[]>([])
  const [feesLoading, setFeesLoading] = useState(true)

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  })

  const loadFees = useCallback(async (params?: FeeParams) => {
    try {
      setFeesLoading(true)
      // Dùng 'any' để linh hoạt xử lý cấu trúc JSON trả về
      const response: any = await feesApi.getFees(params, token || undefined)
      
      console.log("API Response chuẩn:", response); 

      // Cấu trúc JSON: { success: true, data: { data: [...], meta: {...} } }
      
      // Kiểm tra xem response.data có chứa thuộc tính .data (mảng) và .meta không
      if (response?.data?.data && Array.isArray(response.data.data)) {
        // 1. Lấy mảng dữ liệu Fees
        setFees(response.data.data);

        // 2. Lấy thông tin phân trang Meta
        if (response.data.meta) {
          setPagination({
            page: Number(response.data.meta.page),
            totalPages: Number(response.data.meta.totalPages),
            total: Number(response.data.meta.total)
          });
        }
      } 
      // Fallback: Trường hợp backend trả về mảng trực tiếp (nếu có lỗi gì đó)
      else if (response?.data && Array.isArray(response.data)) {
         setFees(response.data);
         // Fake pagination
         setPagination({ page: 1, totalPages: 1, total: response.data.length });
      } else {
         setFees([]);
      }

    } catch (error) {
      console.error("Lỗi load fees:", error)
      setFees([]) 
    } finally {
      setFeesLoading(false)
    }
  }, [token])

 const createFee = useCallback(async (data: any) => {
      await feesApi.createFee(data, token || undefined)
      await loadFees({ page: pagination.page }) 
  }, [loadFees, token, pagination.page])

  const updateFee = useCallback(async (id: number, data: any) => {
      await feesApi.updateFee(id, data, token || undefined)
      await loadFees({ page: pagination.page })
  }, [loadFees, token, pagination.page])

  const deleteFee = useCallback(async (id: number) => {
      await feesApi.deleteFee(id, token || undefined)
      await loadFees({ page: pagination.page })
  }, [loadFees, token, pagination.page])

  // --- ASSIGNMENT ---
  const createAssignment = useCallback(async (data: CreateAssignmentDto) => {
    await feeAssignmentsApi.createAssignment(data, token || undefined)
  }, [token])

  const getFeeDetail = useCallback(async (feeId: number, param?: any) => {
    const res = await feeAssignmentsApi.getFeeDetail(feeId, param, token || undefined)
    return res.data 
  }, [token])

  const getHouseholdFees = useCallback(async (householdId: number) => {
    const res = await feeAssignmentsApi.getHouseholdFees(householdId, token || undefined)
    return res.data
  }, [token])


  const approvePayment = useCallback(async (paymentId: number) => {
    await feeAssignmentsApi.approvePayment(paymentId, token || undefined)
    toast.success("Đã duyệt thanh toán",{ description: "Thành công"})
  },[token])
  const rejectPayment = useCallback(async (paymentId: number, note: string) => {
    await feeAssignmentsApi.rejectPayment(paymentId, note, token || undefined)
    toast.error("Đã từ chối",{description: "Thanh toán đã bị từ chối",})
  }, [token])

  const submitPayment = useCallback(async (feeAssignmentId: number, amount: number, file: File) => {
    if (!token) return;
    
    try {
      const uploadRes = await feeAssignmentsApi.uploadPaymentProof(file, token);
      const imageUrl = uploadRes?.data?.url;
      const imagePath = uploadRes?.data?.path;
      
      if (!imageUrl || !imagePath) {
        throw new Error("Lỗi khi upload ảnh");
      }


      const payload: CreatePaymentPayload = {
        feeAssignmentId,
        amountPaid: amount,
        imageUrl: imageUrl,
        imagePath: imagePath
      };

      await feeAssignmentsApi.createPayment(payload, token);

      toast.success("Gửi yêu cầu thanh toán thành công!", { 
        description: "BQL sẽ duyệt khoản thanh toán của bạn sớm." 
      });
      
    } catch (error) {
      console.error(error);
      toast.error("Gửi thanh toán thất bại", { description: "Vui lòng thử lại sau" });
      throw error;
    }
  }, [token]);

  return (
    <FeeContext.Provider
      value={{
        fees,
        feesLoading,
        loadFees,
        createFee,
        updateFee,
        deleteFee,
        createAssignment,
        getFeeDetail,
        getHouseholdFees,
        approvePayment,
        submitPayment,
        rejectPayment,
        pagination
      }}
    >
      {children}
    </FeeContext.Provider>
  )
}

export function useFeeContext() {
  const context = useContext(FeeContext)
  if (undefined === context) throw new Error("useFeeContext must be used within FeeProvider")
  return context
}