"use client"

import Link from "next/link"

export default function DeclarationsPage() {
  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Khai báo</h1>

        <p className="text-muted-foreground mb-6">Danh sách các khai báo của cư dân. Tạo, xem hoặc quản lý khai báo ở đây.</p>

        <div className="flex gap-3 mb-6">
          <Link href="/resident/declarations/new" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Tạo khai báo mới
          </Link>
          <Link href="/resident" className="inline-flex items-center px-4 py-2 border rounded-md">
            Quay lại
          </Link>
        </div>

        <div className="bg-card border border-border rounded-md p-4">
          <p className="text-sm text-muted-foreground">Chưa có khai báo nào. Khi có khai báo, danh sách sẽ hiển thị ở đây.</p>
        </div>
      </div>
    </div>
  )
}
