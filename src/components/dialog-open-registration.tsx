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

import { OpenRegistration } from "@/api-client/open-registration";

import {
  OpenRegistrationInput,
  OpenRegistrationSchema,
} from "@/utils/open-registration-schema";

import { formatDateToInputValue, parseInputValueToDate } from "@/utils/date";

import { generateCohorts, generateYears } from "@/utils/generate-years-cohorts";

import { Major } from "@/utils/major";

import { toast } from "sonner";

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

import { Input } from "@/components/ui/input";

import { Plus, Trash2 } from "lucide-react";

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

function DialogOpenRegistration() {
  const router = useRouter();

  const form = useForm<OpenRegistrationInput>({
    resolver: zodResolver(
      OpenRegistrationSchema
    ) as unknown as Resolver<OpenRegistrationInput>,
    mode: "onSubmit",
    defaultValues: {
      timeStart: undefined as unknown as Date,
      timeEnd: undefined as unknown as Date,
      major: [],
      semester: "1",
      schoolYear: generateYears(2000).at(-1),
      cohort: generateCohorts(2020).at(1) ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "major",
  });

  const mutationOpenRegistration = useMutation({
    mutationFn: OpenRegistration,
    onSuccess: (response) => {
      const { msg } = response.data;
      form.reset();
      remove();
      setOpenDialog(false);
      toast.success(msg);
      router.refresh();
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Tạo thời gian đăng ký thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const onSubmit: SubmitHandler<OpenRegistrationInput> = (data) => {
    if (mutationOpenRegistration.isPending) return;
    mutationOpenRegistration.mutate(data);
  };

  const [isOpenDialog, setOpenDialog] = useState<boolean>(false);

  const handleOpenChangeDialog = (open: boolean) => {
    if (mutationOpenRegistration.isPending) return;
    if (!open) {
      form.reset();
      remove();
    }
    setOpenDialog(open);
  };

  return (
    <Dialog open={isOpenDialog} onOpenChange={handleOpenChangeDialog}>
      <DialogTrigger asChild>
        <Button>Tạo đăng ký</Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-sm max-h-[95%] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Tạo thời gian đăng ký thực tập</DialogTitle>
          <DialogDescription>
            Đảm bảo thời gian đăng ký không trùng với đợt đăng ký khác trong
            cùng năm học, học kỳ, khóa và ngành đăng ký.
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
                          className="flex items-center gap-3 border p-3 rounded-xl bg-stone-50">
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
                                    <SelectTrigger className="max-w-[270px]">
                                      <SelectValue placeholder="Chọn ngành" />
                                    </SelectTrigger>
                                    <SelectContent className="w-fit">
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

                          <FormField
                            control={form.control}
                            name={`major.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem className="w-28">
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
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2 mt-1"
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
              <DialogClose asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={mutationOpenRegistration.isPending}>
                  Hủy
                  <Kbd>Esc</Kbd>
                </Button>
              </DialogClose>

              {mutationOpenRegistration.isPending ? (
                <Button variant="outline" disabled size="sm">
                  <Spinner />
                  Đang tạo...
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={mutationOpenRegistration.isPending}>
                  Xác nhận
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
export default React.memo(DialogOpenRegistration);
