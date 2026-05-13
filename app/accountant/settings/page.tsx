"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/context/auth-context"
import { apiRequest } from "@/lib/api/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RoleMap, getDisplayValue } from "@/lib/enums"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserSetting {
  id: number
  username: string
  email: string
  role: string
}

export default function AccountantSettingsPage() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [setting, setSetting] = useState<UserSetting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Update username
  const [newUsername, setNewUsername] = useState("")
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [usernameMessage, setUsernameMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  // Update email
  const [newEmail, setNewEmail] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  // Update password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  // Delete account
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    const fetchSetting = async () => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const res = await apiRequest("/user/setting", "GET", undefined, token ?? undefined)
        const data = (res as any)?.data || res
        setSetting(data)
        setNewUsername(data.username)
        setNewEmail(data.email || "")
      } catch (err: any) {
        setError(err?.message || "Không thể tải thông tin cài đặt")
      } finally {
        setLoading(false)
      }
    }
    fetchSetting()
  }, [token])

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameMessage({ type: "error", text: "Username không được để trống" })
      return
    }
    setUsernameLoading(true)
    setUsernameMessage(null)
    try {
      await apiRequest("/user/setting/update", "PATCH", { username: newUsername }, token ?? undefined)
      setUsernameMessage({ type: "success", text: "Cập nhật username thành công" })
      if (setting) setSetting({ ...setting, username: newUsername })
    } catch (err: any) {
      setUsernameMessage({ type: "error", text: err?.message || "Cập nhật username thất bại" })
    } finally {
      setUsernameLoading(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      setEmailMessage({ type: "error", text: "Email không được để trống" })
      return
    }
    setEmailLoading(true)
    setEmailMessage(null)
    try {
      await apiRequest("/user/setting/update", "PATCH", { email: newEmail }, token ?? undefined)
      setEmailMessage({ type: "success", text: "Cập nhật email thành công" })
      if (setting) setSetting({ ...setting, email: newEmail })
    } catch (err: any) {
      setEmailMessage({ type: "error", text: err?.message || "Cập nhật email thất bại" })
    } finally {
      setEmailLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Mật khẩu mới không khớp" })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự" })
      return
    }
    setPasswordLoading(true)
    setPasswordMessage(null)
    try {
      await apiRequest("/user/setting/update", "PATCH", { 
        oldPassword: currentPassword, 
        newPassword 
      }, token ?? undefined)
      setPasswordMessage({ type: "success", text: "Đổi mật khẩu thành công" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err?.message || "Đổi mật khẩu thất bại" })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password")
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      await apiRequest("/user/delete-account", "DELETE", undefined, token ?? undefined)
      logout()
      router.push("/auth/login")
    } catch (err: any) {
      alert(err?.message || "Xóa tài khoản thất bại")
    } finally {
      setDeleteLoading(false)
      setDeleteConfirmOpen(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Cài đặt</h1>
        <p className="text-muted-foreground mb-6">Quản lý thông tin tài khoản của bạn.</p>

        {loading && (
          <div className="bg-card border border-border rounded-md p-4">
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && setting && (
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin tài khoản</CardTitle>
                <CardDescription>Thông tin cơ bản về tài khoản của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground text-sm">ID</div>
                    <div className="font-medium">{setting.id}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-sm">Vai trò</div>
                    <div className="font-medium">{getDisplayValue(setting.role, RoleMap)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Update Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Cập nhật thông tin tài khoản</CardTitle>
                <CardDescription>Thay đổi thông tin cá nhân và mật khẩu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Username Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Username</h3>
                  {usernameMessage && (
                    <Alert variant={usernameMessage.type === "error" ? "destructive" : "default"}>
                      {usernameMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <AlertDescription>{usernameMessage.text}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Nhập username mới"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleUpdateUsername} disabled={usernameLoading}>
                        {usernameLoading ? "Đang cập nhật..." : "Cập nhật"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t" />

                {/* Email Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Email</h3>
                  {emailMessage && (
                    <Alert variant={emailMessage.type === "error" ? "destructive" : "default"}>
                      {emailMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <AlertDescription>{emailMessage.text}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        id="email"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Nhập email mới"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleUpdateEmail} disabled={emailLoading}>
                        {emailLoading ? "Đang cập nhật..." : "Cập nhật"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t" />

                {/* Password Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Mật khẩu</h3>
                  {passwordMessage && (
                    <Alert variant={passwordMessage.type === "error" ? "destructive" : "default"}>
                      {passwordMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <AlertDescription>{passwordMessage.text}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Mật khẩu mới</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdatePassword} disabled={passwordLoading}>
                      {passwordLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                    </Button>
                    <Button variant="outline" onClick={handleForgotPassword}>
                      Quên mật khẩu
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Xóa tài khoản</CardTitle>
                <CardDescription>Xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                  Xóa tài khoản
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tài khoản</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác và tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteLoading}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>
              {deleteLoading ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
