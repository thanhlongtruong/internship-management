"use client";

import { usePathname } from "next/navigation";

type Labels = { section: string; page: string };

const ROUTE_LABELS: Record<string, Labels> = {
  "/sv/register-course": { section: "Thực tập", page: "Đăng ký học phần" },
  "/bcn/registered-students": { section: "Thực tập", page: "Sinh viên" },
  "/bcn/lecturer": { section: "Thực tập", page: "Giảng viên" },
  "/pdt/notify": { section: "Nội bộ", page: "Thông báo" },
  "/pdt/open-course": { section: "Thực tập", page: "Mở đăng ký" },
  "/pdt/statistics": { section: "Thực tập", page: "Thống kê" },
  "/gv/course_advisor": { section: "Thực tập", page: "Lớp thực tập" },
};

function resolveLabels(pathname: string, fallback: Labels): Labels {
  if (/^\/(sv|gv|bcn|pdt)\/info$/.test(pathname)) {
    return { section: "Tài khoản", page: "Thông tin" };
  }
  if (/^\/(sv|gv|bcn|pdt)\/advisors$/.test(pathname)) {
    return { section: "Thực tập", page: "Giảng viên hướng dẫn" };
  }
  return ROUTE_LABELS[pathname] ?? fallback;
}

export function BreadcrumbDynamic({
  fallback = { section: "Trang", page: "Nội dung" },
}: {
  fallback?: Labels;
}) {
  const pathname = usePathname();
  const labels = resolveLabels(pathname, fallback);
  return (
    <div className="flex items-center gap-2">
      <span className="hidden md:block">{labels.section}</span>
      <span className="hidden md:block">/</span>
      <span>{labels.page}</span>
    </div>
  );
}
