// =============================================================
// components/ui/StatusBadge.tsx — Badge แสดงสถานะ
// ใช้แสดงสถานะ available / booked / blocked
// =============================================================

import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/types";

const statusStyles: Record<AvailabilityStatus, string> = {
  available: "bg-green-500/20 text-green-400 border-green-500/50",
  booked: "bg-red-500/20 text-red-400 border-red-500/50",
  blocked: "bg-gray-500/20 text-gray-400 border-gray-500/50",
};

const statusLabels: Record<AvailabilityStatus, string> = {
  available: "ว่าง",
  booked: "จอง",
  blocked: "ปิด",
};

export default function StatusBadge({ status }: { status: AvailabilityStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
