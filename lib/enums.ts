// Enum mappings from English to Vietnamese

export const StateMap: Record<string, string> = {
  INACTIVE: "Không hoạt động",
  ACTIVE: "Hoạt động",
  DELETED: "Đã xóa",
}

export const RoleMap: Record<string, string> = {
  USER: "Cư dân",
  ADMIN: "Quản trị viên",
  ACCOUNTANT: "Kế toán",
}

export const HouseHoldStatusMap: Record<string, string> = {
  ACTIVE: "Hoạt động",
  MOVED: "Đã chuyển đi",
  DELETE: "Đã xóa",
}

export const InformationStatusMap: Record<string, string> = {
  PENDING: "Đang chờ",
  APPROVED: "Đã phê duyệt",
  REJECTED: "Bị từ chối",
  ENDED: "Kết thúc",
}

export const GenderMap: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
}

export const RelationshipToHeadMap: Record<string, string> = {
  HEAD: "Chủ hộ",
  WIFE: "Vợ",
  HUSBAND: "Chồng",
  SON: "Con trai",
  DAUGHTER: "Con gái",
  FATHER: "Cha",
  MOTHER: "Mẹ",
  OTHER: "Khác",
}

export const ResidenceStatusMap: Record<string, string> = {
  NORMAL: "Thường trú",
  TEMP_ABSENT: "Tạm vắng",
  TEMP_RESIDENT: "Tạm cư",
  MOVE_OUT: "Đã chuyển đi",
}

// Helper function to get display value with fallback
export const getDisplayValue = (
  value: string | undefined | null,
  map: Record<string, string>
): string => {
  if (!value) return "-"
  return map[value] || value
}
