"use client";

import React, { useState } from "react";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";

import { SendNotifyJoinTrainingProgram } from "../api-client/notification";
import { AxiosError } from "axios";
import { TypesUser, useUserStore } from "../store/use-user-store";
import { ClipboardPaste } from "lucide-react";

function DialogSendRequestToJoinTrainingRoom() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();

  const formSchema = z.object({
    code: z
      .string("Vui lòng nhập mã phòng đào tạo.")
      .regex(/^PDT-[A-Za-z0-9]{6}$/, {
        message: "Mã phòng đào tạo có dạng PDT-x (x: 6 ký tự chữ hoặc số)",
      })
      .refine(
        (val) => {
          if (!user?.pdt) return true;

          return val !== (user.pdt as TypesUser)?.code;
        },
        { message: "Bạn đã tham gia PDT này." }
      ),
  });

  const [isOpenDialog, setOpenDialog] = useState<boolean>(false);

  const handleOpenChangeDialog = (open: boolean) => {
    if (!open) form.setValue("code", "PDT-x");
    setOpenDialog(open);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "PDT-x",
    },
    mode: "onSubmit",
  });

  const mutationSendRequest = useMutation({
    mutationFn: SendNotifyJoinTrainingProgram,
    onSuccess: (response) => {
      const { msg } = response.data;
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setOpenDialog(false);
      form.setValue("code", "PDT-x");
      toast.success(msg);
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Gửi yêu cầu thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const handlePasteCode = async () => {
    const text = await navigator.clipboard.readText();
    if (text.trim().length === 0 || text.length > 10) {
      toast.warning("Mã code không hợp lệ.");
      return;
    }
    form.setValue("code", text);
  };

  const handleSubmit: SubmitHandler<{ code: string }> = (data) => {
    if (mutationSendRequest.isPending) return;
    mutationSendRequest.mutate({
      code_pdt: data.code,
    });
  };

  return (
    <Dialog open={isOpenDialog} onOpenChange={handleOpenChangeDialog}>
      <DialogTrigger asChild>
        <button className="relative break-words h-fit text-stone-600 hover:text-stone-900 hover:pl-2 py-1 duration-500 transition-all cursor-pointer hoverFuc">
          Tham gia PDT
        </button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Tham gia phòng đào tạo</DialogTitle>
          <DialogDescription>
            Nhập mã mà phòng đào tạo đã cung cấp cho bạn.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Mã phòng đào tạo</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-x-3">
                      <Input {...field} />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon-sm"
                            className="mb-0.5"
                            onClick={handlePasteCode}>
                            <ClipboardPaste />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Paste Code</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-3">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  size="sm"
                  disabled={mutationSendRequest.isPending}>
                  Hủy
                  <Kbd>Esc</Kbd>
                </Button>
              </DialogClose>
              {mutationSendRequest.isPending ? (
                <Button variant="outline" disabled size="sm">
                  <Spinner />
                  Please wait
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="cursor-pointer"
                  size="sm"
                  disabled={mutationSendRequest.isPending}>
                  Gửi yêu cầu
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
export default React.memo(DialogSendRequestToJoinTrainingRoom);
