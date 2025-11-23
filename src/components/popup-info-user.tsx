"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleDetail } from "@/utils/role";
import { useStatePopupInfoUser } from "@/store/use-state-popup-info-user";

export default function PopupInfoUser() {
  const { user, isOpen, reset } = useStatePopupInfoUser();

  if (!user) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) reset();
      }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Thông tin {RoleDetail[user?.role]}</DialogTitle>
        </DialogHeader>
        <div className="w-full flex flex-col gap-3">
          <p>Email: {user?.email}</p>
          {user?.role !== "pdt" && (
            <div className="flex flex-wrap gap-3">
              <p>Giới tính: {user?.gender}</p>
              <p>|</p>
              <p>Ngày sinh: {user?.birthday}</p>
            </div>
          )}
          <p>Trường: {user?.school}</p>
          {user?.role === "pdt" && <p>CODE: {user?.code}</p>}
          {user?.role === "sv" && <p>Khóa: {user?.cohort}</p>}
          {user?.role === "sv" && <p>Ngành: {user?.major}</p>}{" "}
          {(user?.role === "gv" || user?.role === "bcn") && (
            <p>
              {(user?.role === "gv" || user?.role === "bcn") &&
                `Khoa: ${user?.faculty}`}
            </p>
          )}
        </div>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" size="sm" onClick={reset}>
              Đóng
              <Badge variant="outline" className="text-white">
                Esc
              </Badge>
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
