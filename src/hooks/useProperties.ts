// =============================================================
// hooks/useProperties.ts — Hook ดึงข้อมูล Properties
// ใช้ SWR สำหรับ data fetching + caching + revalidation
// =============================================================

"use client";

import useSWR from "swr";
import type { PropertyWithStats } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProperties(source?: string) {
  const params = source ? `?source=${source}` : "";
  const { data, error, isLoading, mutate } = useSWR<PropertyWithStats[]>(
    `/api/properties${params}`,
    fetcher
  );

  return {
    properties: Array.isArray(data) ? data : [],
    isLoading,
    isError: !!error,
    mutate, // เรียก mutate() เพื่อ refresh ข้อมูล
  };
}
