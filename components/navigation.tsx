"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Building2, LogIn, LogOut, Menu, User, X } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/context/auth-context"

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout, isLoading } = useAuth()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">ApartmentHub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Trang chủ
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user.username}</span>
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-primary/10 rounded">{user.role}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/auth/login">
                        <LogIn className="h-4 w-4 mr-2" />
                        Đăng nhập
                      </Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40 animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/") ? "text-primary" : "text-muted-foreground"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                {!isLoading && (
                  <>
                    {user ? (
                      <>
                        <div className="flex items-center gap-2 text-sm py-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{user.username}</span>
                          <span className="text-xs text-muted-foreground px-2 py-1 bg-primary/10 rounded">
                            {user.role}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            logout()
                            setMobileMenuOpen(false)
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Đăng xuất
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                            <LogIn className="h-4 w-4 mr-2" />
                            Đăng nhập
                          </Link>
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
