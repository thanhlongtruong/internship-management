"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { useEdgeStore } from "@/lib/edgestore";

import { useMutation } from "@tanstack/react-query";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { Form, FormField } from "@/components/ui/form";

import { AxiosError } from "axios";

import UploadFile from "../upload-file";

import {
  SubmitAssignmentFormValues,
  SubmitAssignmentSchema,
} from "@/utils/submit-assignment-schema";

import { SubmitAssignment } from "@/api-client/course-student";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Kbd } from "@/components/ui/kbd";

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

import { Spinner } from "../ui/spinner";

function DialogSubmitAssignment(dataParam: {
  idAdvisorGroup: string;
  idAssignment: string;
  idTitle: string;
  titleName: string;
  hasSubmitted: boolean;
  deadline: string;
}) {
  const router = useRouter();

  const { edgestore } = useEdgeStore();

  const {
    idAdvisorGroup,
    idAssignment,
    idTitle,
    titleName,
    hasSubmitted,
    deadline,
  } = dataParam;

  const [openDialog, setOpenDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useForm<SubmitAssignmentFormValues>({
    resolver: zodResolver(SubmitAssignmentSchema),
    mode: "onSubmit",
    defaultValues: {
      files: [],
    },
  });

  const canSubmit = form.formState.isValid;

  const mutationSubmitAssignment = useMutation({
    mutationFn: SubmitAssignment,
    onSuccess: (response) => {
      const { msg } = response.data;
      setOpenDialog(false);
      form.reset();
      toast.success(msg);
      router.refresh();
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Nộp bài thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const onSubmit = (values: SubmitAssignmentFormValues) => {
    if (mutationSubmitAssignment.isPending) return;

    if (!idAdvisorGroup || !idAssignment || !idTitle) {
      toast.error(
        "Thiếu các thông tin cần thiết để lưu nộp bài. Vui lòng thử lại sau."
      );
      return;
    }

    mutationSubmitAssignment.mutate({
      idAdvisorGroup: idAdvisorGroup,
      idAssignment: idAssignment,
      idTitle: idTitle,
      ...values,
    });
  };

  const handleOpenChangeDialog = async (open: boolean) => {
    const currentDate = new Date();
    const deadlineDate = new Date(deadline);
    if (currentDate > deadlineDate) {
      toast.error("Hạn nộp bài đã hết.");
      return;
    }

    if (mutationSubmitAssignment.isPending) return;

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
    <Dialog open={openDialog} onOpenChange={handleOpenChangeDialog}>
      <DialogTrigger asChild>
        <Button size="sm">{hasSubmitted ? "Nộp lại" : "Nộp bài"}</Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[600px] max-h-[90vh] overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Nộp {hasSubmitted ? "lại" : ""} bài {titleName}
          </DialogTitle>
        </DialogHeader>
        {hasSubmitted && (
          <DialogDescription>
            Khi nộp bài lại đồng nghĩa các file đã nộp trước đó sẽ bị gỡ bỏ.
          </DialogDescription>
        )}
        <Form {...form}>
          <form className="" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-7">
              <FormField
                control={form.control}
                name="files"
                render={({ field }) => (
                  <UploadFile idAdvisorGroup={idAdvisorGroup} {...field} />
                )}
              />

              <DialogFooter className="mt-1">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isDeleting || mutationSubmitAssignment.isPending}>
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
                  disabled={
                    !canSubmit ||
                    isDeleting ||
                    mutationSubmitAssignment.isPending
                  }
                  size="sm">
                  {mutationSubmitAssignment.isPending ? (
                    <div className="flex items-center gap-2">
                      <Spinner />
                      {hasSubmitted ? "Đang nộp lại" : "Đang nộp bài"}...
                    </div>
                  ) : hasSubmitted ? (
                    "Xác nhận nộp lại"
                  ) : (
                    "Xác nhận nộp bài"
                  )}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default React.memo(DialogSubmitAssignment);
