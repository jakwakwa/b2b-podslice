"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export function PeriodToggle({ value }: { value: string }) {
  const router = useRouter()
  const params = useSearchParams()

  const onValueChange = (val: string) => {
    if (!val) return
    const next = new URLSearchParams(params.toString())
    next.set("period", val)
    router.push(`?${next.toString()}`)
  }

  return (
    <ToggleGroup type="single" value={value} onValueChange={onValueChange} size="sm">
      <ToggleGroupItem value="7">7d</ToggleGroupItem>
      <ToggleGroupItem value="30">30d</ToggleGroupItem>
      <ToggleGroupItem value="90">90d</ToggleGroupItem>
    </ToggleGroup>
  )
}


