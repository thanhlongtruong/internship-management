"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">Đã xảy ra lỗi</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "Không thể tải dữ liệu lớp thực tập."}
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Thử lại
      </Button>
    </div>
  );
}
