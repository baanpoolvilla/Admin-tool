// =============================================================
// components/ui/PriceCard.tsx — การ์ดแสดงราคา
// แสดงราคาต่อคืนและสถิติราคา
// =============================================================

import { formatPrice } from "@/lib/utils";

type PriceCardProps = {
  label: string;
  price: number | null;
  subtitle?: string;
};

export default function PriceCard({ label, price, subtitle }: PriceCardProps) {
  return (
    <div className="bg-card rounded-lg border border-white/5 p-4">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-1">
        {formatPrice(price)}
      </p>
      {subtitle && (
        <p className="text-text-secondary text-xs mt-1">{subtitle}</p>
      )}
    </div>
  );
}
