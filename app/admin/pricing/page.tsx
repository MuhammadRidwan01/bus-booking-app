import { Suspense } from "react"
import PricingConfigClient from "./PricingConfigClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function PricingConfigSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Pricing Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Update Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pricing History</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function PricingConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Pricing Configuration</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage pricing for additional services including surfboard handling and excess baggage fees.
        </p>
      </div>
      
      <Suspense fallback={<PricingConfigSkeleton />}>
        <PricingConfigClient />
      </Suspense>
    </div>
  )
}