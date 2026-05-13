"use client"

import { useEffect, useState } from "react"
import { adminGetPendingTempAbsents } from "@/lib/api/registration/registrationApi"
import { useAuth } from "@/lib/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ReviewTempAbsentDialog } from "./ReviewTempAbsentDialog"

interface AdminTempAbsent {
  id: number
  submittedAt?: string
  resident?: { id?: number | string; fullname?: string; nationalId?: string; houseHoldId?: number | string }
}

interface Props {
  status: "PENDING" | "APPROVED" | "ENDED" | "REJECTED"
  title: string
  showActions?: boolean
  keyword?: string
}

export function AdminTempAbsentStatusList({ status, title, showActions = false, keyword }: Props) {
  const { token } = useAuth()
  const [items, setItems] = useState<AdminTempAbsent[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(1)
  const [sortBy, setSortBy] = useState<string>("submittedAt")
  const [order, setOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await adminGetPendingTempAbsents(token ?? undefined, { status, page, limit: pageSize, sortBy, order, keyword })
        // Server returns: { data: { page, limit, total, totalPages, items: [...] } }
        const dataObj = res?.data ?? res
        const dataArr = Array.isArray(dataObj?.items) ? dataObj.items : (Array.isArray(dataObj) ? dataObj : [])
        const normalized = dataArr.map((it: any) => (it && typeof it === "object" && it.select ? it.select : it))
        setItems(normalized)
        const totalFromRes = dataObj?.total ?? res?.total ?? res?.meta?.total ?? dataArr.length
        setTotalCount(typeof totalFromRes === "number" ? totalFromRes : 0)
      } catch (err: any) {
        setError(err?.message ?? "Không thể tải danh sách")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [token, page, pageSize, sortBy, order, status, keyword])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const onUpdated = () => {
    void (async () => {
      setLoading(true)
      try {
        const res = await adminGetPendingTempAbsents(token ?? undefined, { status, page, limit: pageSize, sortBy, order, keyword })
        const dataObj = res?.data ?? res
        const dataArr = Array.isArray(dataObj?.items) ? dataObj.items : (Array.isArray(dataObj) ? dataObj : [])
        const normalized = dataArr.map((it: any) => (it && typeof it === "object" && it.select ? it.select : it))
        setItems(normalized)
        const totalFromRes = dataObj?.total ?? res?.total ?? res?.meta?.total ?? dataArr.length
        setTotalCount(typeof totalFromRes === "number" ? totalFromRes : 0)
      } catch (err: any) {
        setError(err?.message ?? "Không thể tải danh sách")
      } finally {
        setLoading(false)
      }
    })()
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(field)
      setOrder("desc")
    }
    setPage(1)
  }

  const fmt = (iso?: string, withTime = false) => {
    if (!iso) return "-"
    try {
      return withTime ? format(new Date(iso), "dd/MM/yyyy HH:mm") : format(new Date(iso), "dd/MM/yyyy")
    } catch {
      return "-"
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const displayed = items

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages)
    setPage(next)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title} ({totalCount})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div>Đang tải...</div>}
        {error && <div className="text-destructive">{error}</div>}
        {!loading && items.length === 0 && <div className="text-sm text-muted-foreground">Không có đơn.</div>}

        {!loading && items.length > 0 && (
          <div className="w-full mt-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="whitespace-nowrap text-center cursor-pointer select-none"
                      onClick={() => toggleSort("id")}
                    >
                      Mã {sortBy === "id" ? (order === "asc" ? "▲" : "▼") : ""}
                    </TableHead>

                    <TableHead
                      className="whitespace-nowrap text-center cursor-pointer select-none"
                      onClick={() => toggleSort("submittedAt")}
                    >
                      Ngày nộp {sortBy === "submittedAt" ? (order === "asc" ? "▲" : "▼") : ""}
                    </TableHead>

                    <TableHead
                      className="whitespace-nowrap text-center cursor-pointer select-none"
                      onClick={() => toggleSort("resident.fullname")}
                    >
                      Cư dân {sortBy === "resident.fullname" ? (order === "asc" ? "▲" : "▼") : ""}
                    </TableHead>

                    <TableHead
                      className="whitespace-nowrap text-center cursor-pointer select-none"
                      onClick={() => toggleSort("resident.nationalId")}
                    >
                      CCCD {sortBy === "resident.nationalId" ? (order === "asc" ? "▲" : "▼") : ""}
                    </TableHead>

                    <TableHead
                      className="whitespace-nowrap text-center cursor-pointer select-none"
                      onClick={() => toggleSort("resident.houseHoldId")}
                    >
                      Mã hộ {sortBy === "resident.houseHoldId" ? (order === "asc" ? "▲" : "▼") : ""}
                    </TableHead>

                    {showActions && <TableHead className="text-right whitespace-nowrap">Hành động</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium whitespace-nowrap text-center">{it.id}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{fmt(it.submittedAt, true)}</TableCell>
                      <TableCell className="max-w-[200px] overflow-hidden truncate text-center">{it.resident?.fullname ?? "-"}</TableCell>
                      <TableCell className="max-w-[120px] whitespace-nowrap text-center">{it.resident?.nationalId ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">{it.resident?.houseHoldId ?? "-"}</TableCell>
                      {showActions && (
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedId(it.id); setDialogOpen(true) }}>
                              Chi tiết
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Số hàng:</span>
              {[10, 15, 20].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={n === pageSize ? undefined : "outline"}
                  onClick={() => {
                    setPageSize(n)
                    setPage(1)
                  }}
                >
                  {n}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => goToPage(page - 1)} disabled={page === 1}>
                Trước
              </Button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1
                  return (
                    <Button key={p} size="sm" variant={p === page ? undefined : "outline"} onClick={() => goToPage(p)}>
                      {p}
                    </Button>
                  )
                })}
              </div>

              <Button size="sm" variant="outline" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>
                Tiếp
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      {showActions && (
        <ReviewTempAbsentDialog open={dialogOpen} registrationId={selectedId} onClose={() => setDialogOpen(false)} onUpdated={onUpdated} readOnly={true} />
      )}
    </Card>
  )
}
