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
    console.error("Error loading registered students:", error);
  }, [error]);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 py-20">
      <div className="flex flex-col items-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">
            Đã xảy ra lỗi khi tải danh sách sinh viên đăng ký
          </h2>
          <p className="text-muted-foreground mb-4">
            {error.message || "Vui lòng thử lại sau."}
          </p>
        </div>
        <Button onClick={reset} variant="default">
          Thử lại
        </Button>
      </div>
    </div>
  );
}

