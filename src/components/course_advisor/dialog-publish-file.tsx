"use client";

import React from "react";

import { useEdgeStore } from "@/lib/edgestore";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { AxiosError } from "axios";

import {
  PublishFileFormValues,
  PublishFileSchema,
} from "@/utils/publish-file-schema";

import { PublishFile } from "@/api-client/course-advisor";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import UploadFile from "../upload-file";

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

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Spinner } from "../ui/spinner";

function DialogPublishFile(dataParam: {
  idAG: string;
  idA: string;
  idT: string;
}) {
  const { idAG, idA, idT } = dataParam;

  const router = useRouter();

  const { edgestore } = useEdgeStore();

  const [openDialog, setOpenDialog] = React.useState(false);

  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useForm<PublishFileFormValues>({
    resolver: zodResolver(PublishFileSchema),
    mode: "onChange",
    defaultValues: {
      files: [],
    },
  });

  const canSubmit = form.formState.isValid;

  const mutationPublishFile = useMutation({
    mutationFn: PublishFile,
    onSuccess: (response) => {
      const { msg } = response.data;
      setOpenDialog(false);
      form.reset();
      toast.success(msg);
      router.refresh();
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Publish file thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const onSubmit = (values: PublishFileFormValues) => {
    if (mutationPublishFile.isPending) return;

    if (!idAG || !idA || !idT) {
      toast.error("Thiếu các thông tin bắt buộc. Vui lòng thử lại sau.");
      return;
    }

    mutationPublishFile.mutate({
      idAG: idAG,
      idA: idA,
      idT: idT,
      files: values.files,
    });
  };

  const handleOpenChangeDialog = async (open: boolean) => {
    if (mutationPublishFile.isPending) return;
    if (!open) {
      setIsDeleting(true);

      const values = form.getValues("files");

      const urlsToDelete: string[] = [...values.map((f) => f.url)];

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
        <Button size="sm">Publish điểm</Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[600px] max-h-[90vh] overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish file</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          Bạn chỉ có thể publish 1 file excel (.xlsx).
        </DialogDescription>

        <Form {...form}>
          <form className="" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-7">
              <FormField
                control={form.control}
                name="files"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <UploadFile
                        idAdvisorGroup={idAG}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-1">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isDeleting || mutationPublishFile.isPending}>
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
                    isDeleting || mutationPublishFile.isPending || !canSubmit
                  }
                  size="sm">
                  {mutationPublishFile.isPending ? (
                    <div className="flex items-center gap-2">
                      <Spinner />
                      Đang publish...
                    </div>
                  ) : (
                    "Publish file"
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

export default React.memo(DialogPublishFile);
