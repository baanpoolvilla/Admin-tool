// =============================================================
// components/ui/LoadingSpinner.tsx — Loading Indicator
// แสดง spinner ระหว่างรอข้อมูล
// ใช้ได้ทั้ง full page และ inline
// =============================================================

export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-accent border-t-transparent`}
      />
    </div>
  );
}
