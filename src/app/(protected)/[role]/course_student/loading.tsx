import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex flex-col gap-y-6 w-full mt-1">
      <div className="flex items-center justify-between w-full">
        <div className="h-7 w-32 bg-muted/50 rounded animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 bg-muted/50 rounded animate-pulse" />
          <div className="h-9 w-32 bg-muted/50 rounded animate-pulse" />
          <div className="h-9 w-9 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>

      <div className="h-fit mx-auto w-fit py-20 flex items-center gap-2">
        <Spinner />
        <p className="text-zinc-500">Đang tải thông tin lớp thực tập...</p>
      </div>
    </div>
  );
}
