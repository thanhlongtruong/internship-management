"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { useEdgeStore } from "@/lib/edgestore";

import { useMutation } from "@tanstack/react-query";

import { useForm, useFieldArray } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { AxiosError } from "axios";

import { CreateAnnouncement } from "@/api-client/course-advisor";

import UploadFile from "../upload-file";

import {
  AnnouncementFormValues,
  AnnouncementSchema,
} from "@/utils/announcement-schema";

import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Minus, Plus } from "lucide-react";

import { Spinner } from "../ui/spinner";

function DialogCreateAssignment(dataParam: { idAdvisorGroup: string }) {
  const { idAdvisorGroup } = dataParam;

  const router = useRouter();
  const { edgestore } = useEdgeStore();

  const [openDialog, setOpenDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(AnnouncementSchema),
    mode: "onSubmit",
    defaultValues: {
      topic: "",
      description_topic: "",
      files: [],
      title: [],
      announcements_type: "general",
    },
  });

  const {
    fields: titleFields,
    append: appendTitle,
    remove: removeTitle,
  } = useFieldArray({
    control: form.control,
    name: "title",
  });

  const canSubmit = form.formState.isValid;

  const mutationCreateAnnouncement = useMutation({
    mutationFn: CreateAnnouncement,
    onSuccess: (response) => {
      const { msg } = response.data;
      setOpenDialog(false);
      form.reset();
      toast.success(msg);
      router.refresh();
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Tạo assignment thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const onSubmit = (values: AnnouncementFormValues) => {
    if (mutationCreateAnnouncement.isPending) return;

    if (!idAdvisorGroup) {
      toast.error("Không tìm thấy dữ liệu của bạn trong khóa học này.");
      return;
    }

    mutationCreateAnnouncement.mutate({
      idAdvisorGroup: idAdvisorGroup,
      ...values,
      title: values.title ?? [],
    });
  };

  const handleOpenChangeDialog = async (open: boolean) => {
    if (mutationCreateAnnouncement.isPending) return;
    if (!open) {
      setIsDeleting(true);

      const values = form.getValues();

      const urlsToDelete: string[] = [
        ...(values.files ?? []).map((f) => f.url),
        ...(values.title ?? []).flatMap((t) =>
          (t?.files ?? []).map((f) => f.url)
        ),
      ];

      await Promise.allSettled(
        urlsToDelete.map((url) => edgestore.pdfFiles.delete({ url }))
      );

      form.reset();
      removeTitle();

      setIsDeleting(false);
    }
    setOpenDialog(open);
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChangeDialog}>
      <DialogTrigger asChild>
        <Button size="sm">Tạo assignment</Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[600px] max-h-[90vh] overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo assignment mới</DialogTitle>
          <DialogDescription>
            Tạo assignment mới cho lớp thực tập.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-7">
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chủ đề *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập chủ đề" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pl-4">
                  <FormField
                    control={form.control}
                    name="description_topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả chủ đề</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder="Mô tả chủ đề (tuỳ chọn)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("announcements_type") === "general" && (
                  <FormField
                    control={form.control}
                    name="files"
                    render={({ field }) => (
                      <UploadFile idAdvisorGroup={idAdvisorGroup} {...field} />
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="announcements_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại assignment *</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Loại</SelectLabel>
                            <SelectItem value="assignment">Bài tập</SelectItem>
                            <SelectItem value="general">Chung</SelectItem>
                            <SelectItem value="internship_form">
                              Hình thức thực tập
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("announcements_type") === "internship_form" && (
                <div className="grid gap-2 text-sm">
                  <p className="font-medium">Các loại hình thức thực tập:</p>
                  <p>1. Thực tập tại công ty.</p>
                  <p>2. Làm đồ án thay thế.</p>
                </div>
              )}

              {form.watch("announcements_type") === "assignment" && (
                <>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">Danh sách tiêu đề</p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon-sm"
                        onClick={() =>
                          appendTitle({
                            title_name: "",
                            content: "",
                            deadline: "",
                          })
                        }>
                        <Plus />
                      </Button>
                    </div>

                    <div className="grid gap-8">
                      {titleFields.map((f, idx) => (
                        <div key={f.id} className="grid gap-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <FormField
                                control={form.control}
                                name={`title.${idx}.title_name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{`Tiêu đề ${
                                      idx + 1
                                    }`}</FormLabel>
                                    <FormControl>
                                      <div className="flex items-center gap-x-3">
                                        <Input
                                          placeholder="Nhập tiêu đề"
                                          {...field}
                                        />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon-sm"
                                          onClick={() => removeTitle(idx)}>
                                          <Minus />
                                        </Button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="pl-4">
                            <FormField
                              control={form.control}
                              name={`title.${idx}.content`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nội dung</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      rows={5}
                                      placeholder="Mô tả yêu cầu"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`title.${idx}.files`}
                            render={({ field }) => (
                              <UploadFile
                                idAdvisorGroup={idAdvisorGroup}
                                {...field}
                              />
                            )}
                          />

                          <div className="pl-8">
                            <FormField
                              control={form.control}
                              name={`title.${idx}.deadline`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Hạn nộp</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="datetime-local"
                                      value={field.value ?? ""}
                                      onChange={(e) =>
                                        field.onChange(e.target.value)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <DialogFooter className="mt-1">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      isDeleting || mutationCreateAnnouncement.isPending
                    }>
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
                    mutationCreateAnnouncement.isPending
                  }
                  size="sm">
                  {mutationCreateAnnouncement.isPending ? (
                    <div className="flex items-center gap-2">
                      <Spinner />
                      Đang tạo...
                    </div>
                  ) : (
                    "Tạo"
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

export default React.memo(DialogCreateAssignment);
