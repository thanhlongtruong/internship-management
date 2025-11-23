"use client";

import React, { KeyboardEvent, useState } from "react";

import { Kbd } from "@/components/ui/kbd";

import { useMutation } from "@tanstack/react-query";
import { ValidateEmail } from "@/api-client/pdt";
import { Button } from "@/components/ui/button";
import { CornerDownLeft, Info, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Badge } from "@/components/ui/badge";
import { SendInvitationsToJoin } from "@/api-client/notification";
import { Spinner } from "./ui/spinner";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "./ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type EmailStatus = "checking" | "valid" | "invalid" | "joined" | "sent";

type Email = {
  id: number;
  value: string;
  status: EmailStatus;
};

function DialogInviteJoin() {
  const [inputValue, setInputValue] = useState("");
  const [isOpenDialog, setOpenDialog] = useState<boolean>(false);
  const [isOpenAlert, setOpenAlert] = useState<boolean>(false);
  const [emails, setEmails] = useState<Email[]>([]);

  const mutationValidateEmail = useMutation({
    mutationFn: ValidateEmail,
    onError: (error: AxiosError<{ msg: string }>) => {
      const errorMsg =
        error.response?.data?.msg || "Đã xảy ra lỗi. Vui lòng thử lại sau.";
      toast.error(errorMsg);
    },
  });

  const mutationSendInvitationsToJoin = useMutation({
    mutationFn: SendInvitationsToJoin,
    onSuccess: (response) => {
      toast.success(response.data.msg);
      setEmails([]);
      setInputValue("");
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      const errorMsg =
        error.response?.data?.msg || "Đã xảy ra lỗi. Vui lòng thử lại sau.";
      toast.error(errorMsg);
    },
  });

  const handleConfirmClose = () => {
    setOpenDialog(false);
    setInputValue("");
    setEmails([]);
  };

  const handleOpenChangeDialog = (open: boolean) => {
    if (!open && emails.length > 0) {
      setOpenAlert(true);
      return;
    }
    if (!open) {
      setInputValue("");
      setEmails([]);
    }
    setOpenDialog(open);
  };

  const validateEmail = async (id: number, email: string) => {
    try {
      const response = await mutationValidateEmail.mutateAsync(email);
      const { type }: { type: EmailStatus } = response.data;

      setEmails((prev) =>
        prev.map((email) =>
          email.id === id
            ? {
                ...email,
                status: type,
              }
            : email
        )
      );
    } catch (error) {
      setEmails((prev) =>
        prev.map((email) =>
          email.id === id ? { ...email, status: "invalid" } : email
        )
      );
      console.error("Failed to validate email:", error);
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    if (
      (e as React.KeyboardEvent<HTMLInputElement>).key === "Tab" ||
      (e as React.MouseEvent<HTMLButtonElement>).type === "click"
    ) {
      if (inputValue.trim()) {
        e.preventDefault();

        let finalEmail = inputValue.trim();
        if (!finalEmail.includes("@")) {
          finalEmail += "@gmail.com";
        }

        if (emails.some((email) => email.value === finalEmail)) {
          setInputValue("");
          return;
        }

        const newEmail: Email = {
          id: Date.now(),
          value: finalEmail,
          status: "checking",
        };

        setEmails((prev) => [...prev, newEmail]);
        setInputValue("");

        validateEmail(newEmail.id, newEmail.value);
      }
    }
  };

  const removeEmail = (id: number) => {
    setEmails((prev) => prev.filter((email) => email.id !== id));
  };

  const getBadgeVariant = (status: EmailStatus) => {
    switch (status) {
      case "valid":
        return "default";
      case "invalid":
        return "destructive";
      case "checking":
        return "secondary";
      case "joined":
        return "green";
      case "sent":
        return "yellow";
    }
  };

  const handleSubmit = () => {
    const emailInvalid = emails.filter((e) => e.status === "invalid");
    const emailJoined = emails.filter((e) => e.status === "joined");
    const emailSent = emails.filter((e) => e.status === "sent");
    const emailValid = emails
      .filter((e) => e.status === "valid")
      .map((e) => e.value);

    if (emails.length === 0) {
      return;
    } else if (emailInvalid.length > 0) {
      toast.warning(`Có ${emailInvalid.length} email không hợp lệ.`);
    } else if (emailJoined.length > 0) {
      toast.warning(`Có ${emailJoined.length} email đã tham gia.`);
    } else if (emailSent.length > 0) {
      toast.warning(`Có ${emailSent.length} email đã gửi.`);
    } else mutationSendInvitationsToJoin.mutate(emailValid);
  };

  return (
    <>
      <Dialog open={isOpenDialog} onOpenChange={handleOpenChangeDialog}>
        <DialogTrigger asChild>
          <button className="relative hover:pl-2 py-1 duration-500 transition-all cursor-pointer hoverFuc">
            Mời vào PDT
          </button>
        </DialogTrigger>
        <DialogContent
          className="max-w-sm max-h-[95%] flex flex-col"
          onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Mời vào Phòng đào tạo</DialogTitle>
            <DialogDescription>
              Bằng cách nhấn {"Xác nhận"} ở dưới sẽ gửi lời mời tham gia vào PDT
              của bạn. Nhập email mà bạn muốn gửi lời mời.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full flex flex-col gap-3 flex-1 min-h-10">
            <div className="flex w-full gap-3">
              <InputGroup>
                <InputGroupInput
                  placeholder="example"
                  className="!pl-1"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>@gmail.com</InputGroupText>
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InputGroupButton className="rounded-full" size="icon-xs">
                        <Info />
                      </InputGroupButton>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Đã tham gia.
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Không hợp lệ.
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                          Đã gửi trước đó.
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#2f2f31]"></span>
                          Hợp lệ.
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </InputGroupAddon>
              </InputGroup>

              <Button variant="outline" onClick={handleKeyDown}>
                <CornerDownLeft />
                <Kbd>Tab</Kbd>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 flex-1 overflow-y-auto">
              {emails.map((email) => (
                <Badge key={email.id} variant={getBadgeVariant(email.status)}>
                  {email.value}
                  {email.status === "checking" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 rounded-full">
                      <Spinner />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 rounded-full"
                      onClick={() => removeEmail(email.id)}>
                      <X />
                    </Button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <AlertDialog open={isOpenAlert} onOpenChange={setOpenAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bạn muốn tiếp tục?</AlertDialogTitle>
                <AlertDialogDescription>
                  Nếu bạn đóng cửa sổ này, tất cả các email đã nhập sẽ bị xóa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmClose}>
                  Tiếp tục
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={mutationSendInvitationsToJoin.isPending}>
                Đóng
                <Kbd>Esc</Kbd>
              </Button>
            </DialogClose>
            {mutationSendInvitationsToJoin.isPending ? (
              <Button size="sm" type="submit" disabled>
                Please wait...
              </Button>
            ) : (
              <Button
                size="sm"
                type="submit"
                disabled={emails.length === 0}
                onClick={handleSubmit}>
                Xác nhận
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default React.memo(DialogInviteJoin);
