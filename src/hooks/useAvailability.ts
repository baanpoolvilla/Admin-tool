// =============================================================
// hooks/useAvailability.ts — Hook ดึงข้อมูล Availability
// ดึงข้อมูลวันว่าง/จอง ของ property ที่เลือก
// =============================================================

"use client";

import useSWR from "swr";
import { today, daysFromNow } from "@/lib/utils";
import type { Availability } from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type UseAvailabilityOptions = {
  daysAhead?: number;
};

export function useAvailability(propertyId: string | null, options?: UseAvailabilityOptions) {
  const daysAhead = options?.daysAhead ?? 60;
  const from = today();
  const to = daysFromNow(daysAhead);

  const { data, error, isLoading, mutate } = useSWR<Availability[]>(
    propertyId
      ? `/api/availability?property_id=${propertyId}&from=${from}&to=${to}`
      : null, // ไม่ fetch ถ้ายังไม่เลือก property
    fetcher
  );

  return {
    availability: Array.isArray(data) ? data : [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
