import Link from "next/link"
import { Building2, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
              <Building2 className="h-6 w-6 text-primary" />
              <span>ApartmentHub</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hệ thống quản lý chung cư hiện đại, giúp kết nối ban quản lý và cư dân một cách hiệu quả.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/apartments" className="text-muted-foreground hover:text-primary transition-colors">
                  Căn hộ
                </Link>
              </li>
              <li>
                <Link href="/amenities" className="text-muted-foreground hover:text-primary transition-colors">
                  Tiện ích
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Dịch vụ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors">
                  Quản lý
                </Link>
              </li>
              <li>
                <Link href="/resident" className="text-muted-foreground hover:text-primary transition-colors">
                  Cư dân
                </Link>
              </li>
              <li>
                <Link href="/declarations" className="text-muted-foreground hover:text-primary transition-colors">
                  Khai báo
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="text-muted-foreground hover:text-primary transition-colors">
                  Thông báo
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">123 Đường ABC, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">+84 123 456 789</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">info@apartmenthub.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ApartmentHub. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  )
}
