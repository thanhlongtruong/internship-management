import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="h-8 w-64 bg-muted/50 rounded animate-pulse" />
      <div className="h-6 w-48 bg-muted/50 rounded animate-pulse" />
      <div className="flex flex-wrap gap-3">
        <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" />
        <div className="h-6 w-1 bg-muted/50 rounded" />
        <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" />
      </div>
      <div className="h-6 w-40 bg-muted/50 rounded animate-pulse" />
      <div className="flex items-center gap-2 mt-4">
        <Spinner />
        <p className="text-zinc-500">Đang tải thông tin...</p>
      </div>
    </div>
  );
}
