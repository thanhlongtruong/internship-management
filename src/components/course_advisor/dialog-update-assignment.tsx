"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { useEdgeStore } from "@/lib/edgestore";

import { useMutation } from "@tanstack/react-query";

import { useForm, useFieldArray, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  AnnouncementFormValues,
  AnnouncementSchema,
} from "@/utils/announcement-schema";

import { AxiosError } from "axios";

import { UpdateAnnouncement } from "@/api-client/course-advisor";

import { SerializedAnnouncement } from "@/types/course-advisor";

import UploadFile from "../upload-file";

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

import { Eye, FileIcon, Minus, Plus, Trash2 } from "lucide-react";

import { Spinner } from "../ui/spinner";

function DialogUpdateAssignment(dataParam: {
  idAdvisorGroup: string;
  AnnouncementData: SerializedAnnouncement;
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { idAdvisorGroup, AnnouncementData, isOpen, onOpenChange } = dataParam;
  const router = useRouter();
  const { edgestore } = useEdgeStore();

  const [openDialog, setOpenDialog] = React.useState(isOpen);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    setOpenDialog(isOpen);
  }, [isOpen]);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(AnnouncementSchema),
    mode: "onSubmit",
    defaultValues: {
      topic: AnnouncementData.topic,
      description_topic: AnnouncementData.description_topic,
      files: AnnouncementData.files,
      title: AnnouncementData.title.map((t) => ({
        ...t,
        deadline:
          typeof t.deadline === "string"
            ? new Date(t.deadline).toLocaleString("sv-SE").replace(" ", "T")
            : t.deadline,
      })),
      announcements_type: AnnouncementData.announcements_type,
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

  const watchedFiles = useWatch({ control: form.control, name: "files" });
  const watchedTitles = useWatch({ control: form.control, name: "title" });

  const canSubmit = form.formState.isValid;

  const mutationUpdateAnnouncement = useMutation({
    mutationFn: UpdateAnnouncement,
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

  const announcementsType = useWatch({
    control: form.control,
    name: "announcements_type",
  });

  React.useEffect(() => {
    if (announcementsType === "assignment") {
      form.setValue(
        "title",
        AnnouncementData.title.map((t) => ({
          ...t,
          deadline:
            typeof t.deadline === "string"
              ? new Date(t.deadline).toLocaleString("sv-SE").replace(" ", "T")
              : t.deadline,
        }))
      );
    } else {
      form.setValue("title", []);
    }
  }, [announcementsType]);

  const onSubmit = (values: AnnouncementFormValues) => {
    if (mutationUpdateAnnouncement.isPending) return;

    if (!idAdvisorGroup) {
      toast.error("Không tìm thấy dữ liệu của bạn trong khóa học này.");
      return;
    }

    mutationUpdateAnnouncement.mutate({
      idAdvisorGroup: idAdvisorGroup,
      idAnnouncement: AnnouncementData._id,
      ...values,
      title: values.title ?? [],
    });
  };

  const handleDeleteOldFiles = (url: string) => {
    if (mutationUpdateAnnouncement.isPending) return;

    form.setValue(
      "files",
      form.getValues("files")?.filter((v) => v.url !== url),
      { shouldDirty: true, shouldTouch: true }
    );

    form.setValue(
      "title",
      form.getValues("title")?.map((t) => ({
        ...t,
        files: t.files?.filter((v) => v.url !== url),
      })),
      { shouldDirty: true, shouldTouch: true }
    );
  };

  const handleOpenChangeDialog = async (open: boolean) => {
    if (mutationUpdateAnnouncement.isPending) return;

    if (!open) {
      setIsDeleting(true);

      const values = form.getValues();

      const filesBeforeUpdate = AnnouncementData.files?.map((f) => f.url) ?? [];
      const fileTitlesBeforeUpdate =
        AnnouncementData.title.flatMap((t) => t.files?.map((f) => f.url)) ?? [];

      const urlsToDelete: string[] = [
        ...(values.files ?? [])
          .filter((f) => !filesBeforeUpdate.includes(f.url))
          .map((f) => f.url),

        ...(values.title ?? []).flatMap((t) =>
          (t?.files ?? [])
            .filter((f) => !fileTitlesBeforeUpdate.includes(f.url))
            .map((f) => f.url)
        ),
      ];

      await Promise.allSettled(
        urlsToDelete.map((url) => edgestore.pdfFiles.delete({ url }))
      );

      form.reset();
      removeTitle();

      setIsDeleting(false);
    } else {
      form.reset({
        ...AnnouncementData,
        title: AnnouncementData.title.map((t) => ({
          ...t,
          deadline:
            typeof t.deadline === "string"
              ? new Date(t.deadline).toLocaleString("sv-SE").replace(" ", "T")
              : t.deadline,
        })),
      });
    }
    setOpenDialog(open);
    onOpenChange?.(open);
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChangeDialog}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[600px] max-h-[90vh] overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật assignment</DialogTitle>
          <DialogDescription>
            Cập nhật assignment cho lớp thực tập.
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
                  <>
                    <FormField
                      control={form.control}
                      name="files"
                      render={({ field }) => (
                        <UploadFile
                          idAdvisorGroup={idAdvisorGroup}
                          {...field}
                        />
                      )}
                    />

                    {(watchedFiles ?? []).length > 0 &&
                      (watchedFiles ?? [])
                        .filter((f) => {
                          const filesBeforeUpdate =
                            AnnouncementData.files?.map((f) => f.url) ?? [];
                          return filesBeforeUpdate.includes(f.url);
                        })
                        .map((file, idx) => (
                          <div
                            key={`${file.url}-${idx}`}
                            className="ml-4 shadow-xs flex flex-col justify-center rounded border border-border px-4 py-3">
                            <div className="flex items-center gap-3 text-foreground">
                              <FileIcon className="h-8 w-8 shrink-0 text-muted-foreground" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="text-sm">
                                    <div className="overflow-hidden max-w-64 line-clamp-1 font-medium">
                                      {file.name}
                                    </div>
                                  </div>

                                  <div className="ml-2 flex items-center gap-2">
                                    <div className="flex items-center gap-6">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon-sm"
                                        onClick={() =>
                                          handleDeleteOldFiles(file.url)
                                        }>
                                        <Trash2 />
                                      </Button>

                                      <a href={file.url || ""} target="_blank">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon-sm">
                                          <Eye className="block size-4 shrink-0" />
                                        </Button>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                  </>
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
                            _id: "",
                          })
                        }>
                        <Plus />
                      </Button>
                    </div>

                    <div className="grid gap-8">
                      {titleFields.map((f, idx) => (
                        <div key={f.id} className="grid gap-3">
                          <FormField
                            control={form.control}
                            name={`title.${idx}._id`}
                            render={({ field }) => (
                              <Input type="hidden" {...field} />
                            )}
                          />
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

                          {(watchedTitles?.[idx]?.files ?? []).length > 0 &&
                            (watchedTitles?.[idx]?.files ?? [])
                              .filter((f) => {
                                const filesBeforeUpdate =
                                  AnnouncementData.title.flatMap((t) =>
                                    t.files?.map((f) => f.url)
                                  ) ?? [];
                                return filesBeforeUpdate.includes(f.url);
                              })
                              .map((file, idx2) => (
                                <div
                                  key={`${file.url}-${idx}-${idx2}`}
                                  className="ml-4 shadow-xs flex flex-col justify-center rounded border border-border px-4 py-3">
                                  <div className="flex items-center gap-3 text-foreground">
                                    <FileIcon className="h-8 w-8 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="text-sm">
                                          <div className="overflow-hidden max-w-64 line-clamp-1 font-medium">
                                            {file.name}
                                          </div>
                                        </div>

                                        <div className="ml-2 flex items-center gap-2">
                                          <div className="flex items-center gap-6">
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="icon-sm"
                                              onClick={() =>
                                                handleDeleteOldFiles(file.url)
                                              }>
                                              <Trash2 />
                                            </Button>

                                            <a
                                              href={file.url || ""}
                                              target="_blank">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="icon-sm">
                                                <Eye className="block size-4 shrink-0" />
                                              </Button>
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                          <div className="pl-4">
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
                      isDeleting || mutationUpdateAnnouncement.isPending
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
                    mutationUpdateAnnouncement.isPending
                  }
                  size="sm">
                  {mutationUpdateAnnouncement.isPending ? (
                    <div className="flex items-center gap-2">
                      <Spinner />
                      Đang cập nhật...
                    </div>
                  ) : (
                    "Cập nhật"
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

export default React.memo(DialogUpdateAssignment);
