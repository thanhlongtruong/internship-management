"use client";

import React, { useState } from "react";

import { useRouter } from "next/navigation";

import {
  useForm,
  SubmitHandler,
  Resolver,
  useFieldArray,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { useMutation } from "@tanstack/react-query";

import { AxiosError } from "axios";

import { UpdateOpenRegistration } from "@/api-client/open-registration";

import {
  OpenRegistrationInput,
  OpenRegistrationSchema,
} from "@/utils/open-registration-schema";

import { Major } from "@/utils/major";

import { formatDateToInputValue, parseInputValueToDate } from "@/utils/date";

import { generateCohorts } from "@/utils/generate-years-cohorts";

import { toast } from "sonner";

import { Input } from "@/components/ui/input";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Plus, Trash2, Undo } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Kbd } from "@/components/ui/kbd";

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

function DialogUpdateOpenRegistration(dataParam: {
  dataCourse: OpenRegistrationInput;
  courseId: string;
}) {
  const router = useRouter();

  const form = useForm<OpenRegistrationInput>({
    resolver: zodResolver(
      OpenRegistrationSchema
    ) as unknown as Resolver<OpenRegistrationInput>,
    mode: "onSubmit",
    defaultValues: dataParam.dataCourse,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "major",
  });

  const mutationUpdateOpenRegistration = useMutation({
    mutationFn: UpdateOpenRegistration,
    onSuccess: (response) => {
      const { msg } = response.data;
      setOpenDialog(false);
      toast.success(msg);
      router.refresh();
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Cập nhật thông tin thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const onSubmit: SubmitHandler<OpenRegistrationInput> = (data) => {
    if (mutationUpdateOpenRegistration.isPending) return;
    mutationUpdateOpenRegistration.mutate({
      dataCourse: data,
      courseId: dataParam.courseId,
    });
  };

  const [isOpenDialog, setOpenDialog] = useState<boolean>(false);

  const handleOpenChangeDialog = (open: boolean) => {
    if (mutationUpdateOpenRegistration.isPending) return;
    if (!open) {
      form.reset();
      remove();
    } else form.reset(dataParam.dataCourse);
    setOpenDialog(open);
  };

  return (
    <Dialog open={isOpenDialog} onOpenChange={handleOpenChangeDialog}>
      <DialogTrigger asChild>
        <p>Cập nhật</p>
      </DialogTrigger>
      <DialogContent
        className="max-w-sm max-h-[95%] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Cập nhật tạo đăng ký thực tập</DialogTitle>
          <DialogDescription>
            Bạn có thể thay đổi thông tin khi chưa đến thời gian đăng ký. Đảm
            bảo thời gian đăng ký không trùng với đợt đăng ký khác trong cùng
            năm học, học kỳ, khóa và ngành đăng ký.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="h-full w-full flex flex-col gap-3 flex-1 min-h-10">
            <div className="flex flex-col flex-1 overflow-y-auto gap-6">
              <div className="flex items-center flex-wrap gap-6">
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Học kỳ</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn học kỳ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Học kỳ</SelectLabel>
                              <SelectItem value="1">Học kỳ 1</SelectItem>
                              <SelectItem value="2">Học kỳ 2</SelectItem>
                              <SelectItem value="3">Học kỳ 3</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="schoolYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Năm học</FormLabel>
                      <FormControl>
                        <Input
                          readOnly
                          type="text"
                          value={field.value}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cohort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Khóa</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn khóa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Khóa</SelectLabel>
                              {generateCohorts(2020).map((c: string) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bắt đầu</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={formatDateToInputValue(
                            field.value as Date | undefined
                          )}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(parseInputValueToDate(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kết thúc</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={formatDateToInputValue(
                            field.value as Date | undefined
                          )}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(parseInputValueToDate(val));
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
                name="major"
                render={() => (
                  <FormItem>
                    <FormLabel>Danh sách ngành</FormLabel>

                    <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex flex-wrap items-center justify-between border p-3 rounded-xl bg-stone-50">
                          <FormField
                            control={form.control}
                            name={`major.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">
                                  Tên ngành
                                </FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                      <SelectValue
                                        placeholder="Chọn ngành"
                                        className="flex-1"
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>Ngành</SelectLabel>
                                        {Major.map((m) => (
                                          <SelectItem
                                            key={m.id}
                                            value={m.value}>
                                            {m.value}
                                          </SelectItem>
                                        ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-center gap-3">
                            <FormField
                              control={form.control}
                              name={`major.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem className="w-20">
                                  <FormLabel className="text-xs">
                                    Số lượng
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(Number(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="mt-6"
                              onClick={() => remove(index)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2 my-3"
                        onClick={() => append({ name: "", quantity: 1 })}>
                        <Plus className="w-4 h-4" />
                        Thêm ngành
                      </Button>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="mr-4"
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={mutationUpdateOpenRegistration.isPending}
                    onClick={() => form.reset()}>
                    <Undo />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo</p>
                </TooltipContent>
              </Tooltip>

              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  size="sm"
                  disabled={mutationUpdateOpenRegistration.isPending}>
                  Hủy
                  <Kbd>Esc</Kbd>
                </Button>
              </DialogClose>
              {mutationUpdateOpenRegistration.isPending ? (
                <Button variant="outline" disabled size="sm">
                  <Spinner />
                  Please wait
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="cursor-pointer"
                  size="sm"
                  disabled={mutationUpdateOpenRegistration.isPending}>
                  Cập nhật
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
export default React.memo(DialogUpdateOpenRegistration);
