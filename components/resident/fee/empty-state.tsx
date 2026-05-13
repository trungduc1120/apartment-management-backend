import { Card, CardContent } from "@/components/ui/card"
import { Receipt } from "lucide-react"

interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Receipt className="h-8 w-8 opacity-50" />
        </div>
        <p className="text-sm font-medium">{message}</p>
      </CardContent>
    </Card>
  )
}