"use client"

import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Users, FileText, Shield, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/context/auth-context"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleGetStarted = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    switch (user.role) {
      case "ADMIN":
        router.push("/admin")
        break
      case "USER":
        router.push("/resident")
        break
      case "ACCOUNTANT":
        router.push("/accountant")
        break
      default:
        router.push("/auth/login")
    }
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
                <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  Hệ thống quản lý chung cư hiện đại
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
                  Quản lý chung cư
                  <span className="text-primary"> thông minh</span> và hiệu quả
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
                  Kết nối ban quản lý và cư dân, đơn giản hóa quy trình quản lý căn hộ, theo dõi cư dân và xử lý khai
                  báo tạm trú/tạm vắng một cách nhanh chóng.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" onClick={handleGetStarted} className="group">
                      Bắt đầu ngay
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>

              <div className="relative animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="https://as2.ftcdn.net/v2/jpg/02/83/27/69/1000_F_283276984_7ktetzDuWEmFejgJnY8bgyKNUfzor3Mo.jpg"
                    alt="Modern apartment building"
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                {/* Floating Stats */}
                <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-lg border border-border/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">500+</div>
                      <div className="text-sm text-muted-foreground">Căn hộ</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Tính năng nổi bật</h2>
              <p className="text-lg text-muted-foreground text-pretty">
                Hệ thống toàn diện giúp quản lý mọi khía cạnh của chung cư một cách dễ dàng
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card className="border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Quản lý căn hộ</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Theo dõi thông tin căn hộ, diện tích, tầng, trạng thái và chủ hộ một cách chi tiết và chính xác.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-xl font-semibold">Quản lý cư dân</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Lưu trữ thông tin cá nhân, quan hệ hộ gia đình và theo dõi người tạm trú/tạm vắng hiệu quả.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold">Khai báo trực tuyến</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Cư dân dễ dàng gửi phiếu đăng ký tạm trú/tạm vắng, admin phê duyệt nhanh chóng.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-chart-4" />
                  </div>
                  <h3 className="text-xl font-semibold">Bảo mật cao</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Hệ thống xác thực vai trò, bảo vệ thông tin cá nhân và dữ liệu nhạy cảm của cư dân.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-chart-5/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-chart-5" />
                  </div>
                  <h3 className="text-xl font-semibold">Thống kê báo cáo</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Xem báo cáo chi tiết về số lượng cư dân, tình trạng căn hộ và các hoạt động khác.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Dễ dàng mở rộng</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Kiến trúc linh hoạt, dễ dàng thêm tính năng mới và tích hợp với các hệ thống khác.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
