"use client";

import React from "react";

import { useStatePopupInfoUser } from "@/store/use-state-popup-info-user";

import { IUser } from "@/models/user";

import { Badge } from "@/components/ui/badge";

import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageInfoAccountClientProps {
  user: IUser;
}

function PageInfoAccountClient({ user }: PageInfoAccountClientProps) {
  const { setStore } = useStatePopupInfoUser();

  return (
    <div className="w-full flex flex-col gap-3">
      <p className="text-2xl">
        {user?.name || "No name"} -{" "}
        {user?.role === "sv"
          ? "Sinh viên"
          : user?.role === "gv"
          ? "Giảng viên"
          : user?.role === "bcn"
          ? "Ban chủ nhiệm khoa"
          : user?.role === "pdt"
          ? "Phòng đào tạo"
          : "None Role"}
      </p>

      <p>Email: {user?.email}</p>
      <div className="flex flex-wrap gap-3">
        <p>Giới tính: {user?.gender}</p>
        <p>|</p>
        <p>Ngày sinh: {user?.birthday}</p>
      </div>

      <p>Trường: {user?.school}</p>
      {user?.role === "sv" && <p>Khóa: {user?.cohort}</p>}
      {user?.role === "sv" && <p>Ngành: {user?.major}</p>}
      {user?.role === "gv" && <p>Khoa: {user?.faculty}</p>}

      {user?.role !== "pdt" ? (
        user?.pdt ? (
          <div className="flex items-center gap-4 [--radius:1.2rem]">
            <p>PDT: Đã tham gia Phòng đào tạo.</p>
            <Badge
              className="cursor-pointer"
              onClick={() => {
                if (typeof user.pdt === "object") {
                  const pdtUser = user.pdt as unknown as IUser;
                  setStore({
                    ...pdtUser,
                    exp: 0,
                  } as any);
                }
              }}>
              Xem chi tiết
            </Badge>
          </div>
        ) : (
          <p>PDT: Chưa tham gia Phòng đào tạo.</p>
        )
      ) : null}

      {user?.role === "pdt" && (
        <div className="flex items-center gap-3">
          <p>CODE: {user?.code}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                onClick={() => navigator.clipboard.writeText(user?.code ?? "")}>
                <Copy />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy Code</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

export default React.memo(PageInfoAccountClient);
