// =============================================================
// hooks/useProperties.ts — Hook ดึงข้อมูล Properties
// ใช้ SWR สำหรับ data fetching + caching + revalidation
// =============================================================

"use client";

import useSWR from "swr";
import type { PropertyWithStats } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProperties(source?: string, dateRange?: { from: string; to: string } | null) {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (dateRange?.from && dateRange?.to) {
    params.set("available_from", dateRange.from);
    params.set("available_to", dateRange.to);
  }
  const qs = params.toString() ? `?${params.toString()}` : "";
  const { data, error, isLoading, mutate } = useSWR<PropertyWithStats[]>(
    `/api/properties${qs}`,
    fetcher
  );

  return {
    properties: Array.isArray(data) ? data : [],
    isLoading,
    isError: !!error,
    mutate, // เรียก mutate() เพื่อ refresh ข้อมูล
  };
}
