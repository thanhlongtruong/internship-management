"use client";

import React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";

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

import { useEdgeStore } from "@/lib/edgestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";

import { SendCustomNotification } from "@/api-client/notification";
import UploadFile from "./upload-file";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SendCustomNotificationFormValues,
  SendCustomNotificationSchema,
} from "@/utils/send-custom-notification";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BellPlus } from "lucide-react";
import { Kbd } from "./ui/kbd";

interface DialogSendNotificationProps {
  schoolYear: string;
  semester: string;
  cohort: string;
  typeDialog:
    | "send-custom-notification-from-bcn"
    | "send-custom-notification-from-advisor";
  idAdvisorGroup?: string;
}

export type NotificationTarget_BCN = "advisors" | "students" | "both";
export type NotificationTarget_Advisor = "students" | "bcn" | "both";

export default function DialogSendNotification({
  schoolYear,
  semester,
  cohort,
  typeDialog,
  idAdvisorGroup,
}: DialogSendNotificationProps) {
  const { edgestore } = useEdgeStore();

  const [openDialog, setOpenDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useForm<SendCustomNotificationFormValues>({
    resolver: zodResolver(SendCustomNotificationSchema),
    mode: "onSubmit",
    defaultValues: {
      title: "",
      message: "",
      target: "both",
      files: [],
    },
  });

  const mutationSendNotification = useMutation({
    mutationFn: SendCustomNotification,
    onSuccess: (response) => {
      toast.success(response.data.msg || "Gửi thông báo thành công!");
      setOpenDialog(false);
      form.reset();
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Gửi thông báo thất bại.");
      } else {
        toast.error(error.response.data.msg);
      }
    },
  });

  const handleSubmit = (values: SendCustomNotificationFormValues) => {
    if (mutationSendNotification.isPending) return;

    const from =
      typeDialog === "send-custom-notification-from-bcn" ? "bcn" : "advisor";

    mutationSendNotification.mutate({
      ...values,
      files: values.files || [],
      schoolYear,
      semester,
      cohort,
      from,
    });
  };

  const handleOpenChange = async (open: boolean) => {
    if (mutationSendNotification.isPending) return;
    if (!open) {
      setIsDeleting(true);

      const values = form.getValues();

      const urlsToDelete: string[] = [
        ...(values.files ?? []).map((f) => f.url),
      ];

      if (urlsToDelete.length > 0) {
        await Promise.allSettled(
          urlsToDelete.map((url) => edgestore.pdfFiles.delete({ url }))
        );
      }

      form.reset();

      setIsDeleting(false);
    }
    setOpenDialog(open);
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="icon-sm">
          <BellPlus />
        </Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[600px] max-h-[90vh] overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gửi thông báo</DialogTitle>
          <DialogDescription>
            {typeDialog === "send-custom-notification-from-bcn"
              ? `Gửi thông báo đến giảng viên hướng dẫn / sinh viên đã đăng ký môn
            trong học kỳ ${semester} năm ${schoolYear} khóa ${cohort}.`
              : "Gửi thông báo đến sinh viên trong lớp thực tập / Ban chủ nhiệm"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4 w-full overflow-hidden p-3"
            onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="title">Tiêu đề thông báo *</FormLabel>
                    <FormControl>
                      <Input
                        id="title"
                        placeholder="Nhập tiêu đề thông báo..."
                        value={field.value}
                        onChange={field.onChange}
                        disabled={mutationSendNotification.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="message">
                      Nội dung thông báo *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        id="message"
                        placeholder="Nhập nội dung thông báo..."
                        value={field.value}
                        onChange={field.onChange}
                        disabled={mutationSendNotification.isPending}
                        rows={4}
                        className="min-h-[100px] max-h-[200px] overflow-y-auto"
                        style={{
                          wordWrap: "break-word",
                          overflowWrap: "break-word",
                          whiteSpace: "pre-wrap",
                          lineHeight: "1.5",
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <UploadFile
                  idAdvisorGroup={
                    typeDialog === "send-custom-notification-from-bcn"
                      ? "bcn"
                      : idAdvisorGroup!
                  }
                  {...field}
                />
              )}
            />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gửi đến</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={mutationSendNotification.isPending}>
                        {typeDialog === "send-custom-notification-from-bcn" ? (
                          <>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="advisors" id="advisors" />
                              <Label htmlFor="advisors">
                                Giảng viên hướng dẫn (đã phân công)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="students" id="students" />
                              <Label htmlFor="students">
                                Sinh viên đã đăng ký môn
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="both" id="both" />
                              <Label htmlFor="both">Cả hai</Label>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="bcn" id="bcn" />
                              <Label htmlFor="bcn">Ban chủ nhiệm</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="students" id="students" />
                              <Label htmlFor="students">
                                Sinh viên trong lớp
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="both" id="both" />
                              <Label htmlFor="both">Cả hai</Label>
                            </div>
                          </>
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={mutationSendNotification.isPending || isDeleting}>
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <Spinner />
                      Đang gỡ file...
                    </div>
                  ) : (
                    <>
                      Hủy <Kbd>Esc</Kbd>
                    </>
                  )}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                size="sm"
                disabled={mutationSendNotification.isPending || isDeleting}>
                {mutationSendNotification.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi thông báo"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
