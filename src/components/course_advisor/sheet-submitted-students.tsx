"use client";

import React from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import { TypesUser } from "@/store/use-user-store";

import {
  ExportStudentsScores,
  GetSubmittedStudents,
  SubmitStudentsGrades,
} from "@/api-client/course-advisor";

import { useMutation, useQuery } from "@tanstack/react-query";

import { AxiosError } from "axios";

import { formatVNDateTime } from "@/utils/format-date-time";
import { countDownDate } from "@/utils/count-down-date";

import {
  StudentsGradeFormValues,
  StudentsGradeSchema,
} from "@/utils/students-grade-schema";

import { zodResolver } from "@hookform/resolvers/zod";

import { useForm, useFieldArray, Controller } from "react-hook-form";

const DialogPublishFile = React.lazy(() => import("./dialog-publish-file"));

import { toast } from "sonner";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";

import { Kbd } from "../ui/kbd";

import { Spinner } from "../ui/spinner";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";

import { Input } from "@/components/ui/input";

import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

import { Copy, RefreshCw } from "lucide-react";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

export interface ISubmittedStudents {
  submittedStudents: (TypesUser & {
    submission: {
      _id: string;
      studentId: string;
      file: { _id: string; url: string; name: string }[];
      score: number;
      submittedAt: string;
    } | null;
  })[];
  notSubmittedStudents: (TypesUser & {
    submission: {
      _id: string;
      studentId: string;
      file: { _id: string; url: string; name: string }[];
      score: number;
      submittedAt: string;
    } | null;
  })[];
  counts: {
    total: number;
    submitted: number;
    notSubmitted: number;
  };
  publishedFile: { url: string; name: string } | null;
}

function SheetSubmittedStudents({
  idAdvisorGroup,
  idAnnouncement,
  idTitle,
  deadline,
}: {
  idAdvisorGroup: string;
  idAnnouncement: string;
  idTitle: string;
  deadline: string;
}) {
  const router = useRouter();

  const [isOpenSheet, setIsOpenSheet] = React.useState(false);

  const [isGradingMode, setIsGradingMode] = React.useState(false);

  const [activeTab, setActiveTab] = React.useState("submitted");

  const handleDeadlinePassed = () => {
    const currentDate = new Date();
    const deadlineDate = new Date(deadline);
    return currentDate > deadlineDate;
  };

  const [submittedStudentsData, setSubmittedStudentsData] =
    React.useState<ISubmittedStudents>({
      submittedStudents: [],
      notSubmittedStudents: [],
      counts: {
        total: 0,
        submitted: 0,
        notSubmitted: 0,
      },
      publishedFile: null,
    });

  const form = useForm<StudentsGradeFormValues>({
    resolver: zodResolver(StudentsGradeSchema),
    mode: "onSubmit",
    defaultValues: {
      grades: [],
    },
  });

  const { control, handleSubmit } = form;

  const { fields, replace } = useFieldArray({
    control,
    name: "grades",
  });

  const { data, status, isFetching, refetch } = useQuery({
    queryKey: ["submitted-students", idAdvisorGroup, idAnnouncement, idTitle],
    queryFn: () =>
      GetSubmittedStudents({ idAdvisorGroup, idAnnouncement, idTitle }),
  });

  React.useEffect(() => {
    if (status === "success") {
      const { submittedStudents } = data.data;
      const prepared = submittedStudents.map(
        (s: ISubmittedStudents["submittedStudents"][number]) => ({
          email: s.email,
          grade: s.submission?.score !== -1 ? s.submission?.score : undefined,
        })
      );
      replace(prepared);
      setSubmittedStudentsData(data.data);
    }
  }, [status, data]);

  const handleOpenSheet = (open: boolean) => {
    setIsOpenSheet(open);
    if (!open) {
      setIsGradingMode(false);
    }
  };

  const handleToggleGradingMode = () => {
    setIsGradingMode((prev) => !prev);
  };

  const mutationSubmitStudentsGrades = useMutation({
    mutationFn: SubmitStudentsGrades,
    onSuccess: (response) => {
      const { msg } = response.data;
      toast.success(msg);
      router.refresh();
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error(
          "Lấy danh sách sinh viên đã nộp thất bại. Vui lòng thử lại sau."
        );
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const onSubmit = (values: StudentsGradeFormValues) => {
    if (mutationSubmitStudentsGrades.isPending) return;

    const submittedCount = submittedStudentsData.counts.submitted;
    const allGraded = fields.length === submittedCount;

    if (!allGraded) {
      toast.warning("Vui lòng nhập điểm cho tất cả sinh viên đã nộp.");
      return;
    }
    mutationSubmitStudentsGrades.mutate({
      idAG: idAdvisorGroup,
      idA: idAnnouncement,
      idT: idTitle,
      grades: values.grades,
    });
  };

  const canSubmit = form.formState.isValid;

  const mutationExportStudentsScores = useMutation({
    mutationFn: ExportStudentsScores,
    onSuccess: (response) => {
      try {
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const dispo = response.headers["content-disposition"] as
          | string
          | undefined;
        let fileName = "diem_sinh_vien.xlsx";

        if (dispo) {
          const match = dispo.match(/filename[^;=\n]*=\s*([^;\n]*)/i);
          if (match && match[1]) {
            fileName = match[1].replace(/"/g, "").trim();
          }
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch {
        toast.error("Không thể tải xuống file. Vui lòng thử lại.");
      }
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Xuất điểm sinh viên thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const renderStudentRow = (
    student:
      | ISubmittedStudents["submittedStudents"][number]
      | ISubmittedStudents["notSubmittedStudents"][number]
  ) => {
    const studentKey = student.email;
    const isSubmitted = !!student.submission;
    const alreadyGraded = isSubmitted && student.submission?.score !== -1;
    const idx = fields.findIndex((f) => f.email === student.email);

    return (
      <div
        key={studentKey}
        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-medium">{student.name}</p>
              {alreadyGraded ? (
                <p className="text-sm text-green-500 pl-1">
                  Đã chấm: {student.submission?.score}/10
                </p>
              ) : isSubmitted ? (
                <p className="text-sm text-red-500 pl-1">Chưa chấm</p>
              ) : null}
            </div>
            {isSubmitted && isGradingMode && (
              <div className="w-24">
                {idx !== -1 && (
                  <Controller
                    control={control}
                    name={`grades.${idx}.grade`}
                    render={({ field }) => (
                      <Input
                        type="text"
                        placeholder="Điểm"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            field.onChange(undefined);
                            return;
                          }

                          if (value.startsWith(".")) return;

                          if (
                            value.length > 1 &&
                            value[0] === "0" &&
                            value[1] !== "."
                          )
                            return;

                          if (!/^\d*\.?\d*$/.test(value)) return;

                          const parts = value.split(".");

                          if (parts.length > 2) return;

                          if (parts[1] && parts[1].length > 2) return;

                          const num = parseFloat(value);

                          if (!isNaN(num)) {
                            if (num < 0 || num > 10) return;
                            if (num === 10 && value.includes(".")) return;
                          }
                          field.onChange(value);
                        }}
                        disabled={alreadyGraded}
                        className="text-right"
                      />
                    )}
                  />
                )}
              </div>
            )}
          </div>
          {student.submission ? (
            <div className="mt-3 pl-3">
              <p className="text-sm font-medium">Các file đã nộp:</p>
              <p className="text-xs text-zinc-500">
                Đã nộp {formatVNDateTime(student.submission.submittedAt)}
              </p>

              <div className="flex flex-col gap-2 text-sm text-zinc-800 mt-1.5">
                {student.submission?.file.map((file, idx) => (
                  <Link
                    key={file._id}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline line-clamp-1">
                    {idx + 1}. {file.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 pl-3 text-sm mt-4 text-center">
              Chưa nộp
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Sheet open={isOpenSheet} onOpenChange={handleOpenSheet}>
        <SheetTrigger asChild>
          <Button size="sm">Xem danh sách nộp</Button>
        </SheetTrigger>
        <SheetContent
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:w-full lg:w-[470px] flex flex-col">
          <SheetHeader>
            <div>
              <SheetTitle>Danh sách sinh viên đã nộp</SheetTitle>
              <SheetDescription>
                Sau khi Xác nhận điểm, bạn sẽ không thể thay đổi điểm của sinh
                viên.
              </SheetDescription>
            </div>

            <div className="flex items-start mt-2 w-full">
              {activeTab === "submitted" && (
                <div className="flex flex-col items-center gap-3 w-full">
                  {activeTab === "submitted" && (
                    <div className="w-full flex justify-start">
                      <Button
                        variant={isGradingMode ? "destructive" : "default"}
                        size="sm"
                        className="w-fit"
                        onClick={handleToggleGradingMode}>
                        {isGradingMode ? "Hủy chấm điểm" : "Chấm điểm"}
                      </Button>
                    </div>
                  )}

                  {status === "success" && (
                    <div className="flex items-center gap-5">
                      {submittedStudentsData.counts.notSubmitted > 0 &&
                      !handleDeadlinePassed() ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-fit">
                              Xuất excel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Xác nhận xuất excel
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Khi xuất excel trong khi chưa hết hạn nộp (
                                <span className="font-medium text-red-500">
                                  {formatVNDateTime(deadline)}
                                  {" - "}
                                  {countDownDate(deadline)}
                                </span>
                                ) và các sinh viên chưa nộp sẽ bị điểm 0. Bạn có
                                chắc chắn muốn xuất excel không?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                disabled={
                                  mutationExportStudentsScores.isPending
                                }>
                                Hủy
                              </AlertDialogCancel>
                              <AlertDialogAction
                                disabled={
                                  mutationExportStudentsScores.isPending
                                }
                                onClick={() =>
                                  mutationExportStudentsScores.mutate({
                                    idAG: idAdvisorGroup,
                                    idA: idAnnouncement,
                                    idT: idTitle,
                                  })
                                }>
                                {mutationExportStudentsScores.isPending ? (
                                  <div className="flex items-center gap-2">
                                    <Spinner />
                                    Đang tạo file...
                                  </div>
                                ) : (
                                  "Xác nhận"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          onClick={() =>
                            mutationExportStudentsScores.mutate({
                              idAG: idAdvisorGroup,
                              idA: idAnnouncement,
                              idT: idTitle,
                            })
                          }>
                          {mutationExportStudentsScores.isPending ? (
                            <div className="flex items-center gap-2">
                              <Spinner />
                              <p className="text-zinc-500">Đang tạo file...</p>
                            </div>
                          ) : (
                            "Xuất excel"
                          )}
                        </Button>
                      )}

                      <div className="flex flex-col gap-2">
                        <DialogPublishFile
                          idAG={idAdvisorGroup}
                          idA={idAnnouncement}
                          idT={idTitle}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="w-full flex justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => refetch()}>
                      <RefreshCw
                        className={`${isFetching && "animate-spin"}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tải lại</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            {submittedStudentsData.publishedFile && (
              <div className="flex items-center gap-2">
                <Link
                  href={submittedStudentsData.publishedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 w-full">
                  {submittedStudentsData.publishedFile.name}
                </Link>

                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Copy"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      submittedStudentsData.publishedFile?.url ?? ""
                    );
                    toast.success("Đã copy đường dẫn file.");
                  }}>
                  <Copy />
                </Button>
              </div>
            )}
          </SheetHeader>

          <div className="flex flex-col gap-3 px-4 overflow-y-auto flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="submitted">
                  Đã nộp ({submittedStudentsData.counts.submitted})
                </TabsTrigger>
                <TabsTrigger value="notSubmitted">
                  Chưa nộp ({submittedStudentsData.counts.notSubmitted})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="submitted" className="mt-4">
                <div className="flex flex-col gap-2">
                  {status === "pending" || isFetching ? (
                    <div className="h-fit mx-auto w-fit py-20 flex items-center gap-2">
                      <Spinner />
                      <p className="text-zinc-500">Đang tải danh sách...</p>
                    </div>
                  ) : submittedStudentsData.submittedStudents.length > 0 ? (
                    submittedStudentsData.submittedStudents.map((student) =>
                      renderStudentRow(student)
                    )
                  ) : (
                    <div className="h-fit mx-auto w-fit py-20 flex items-center gap-2">
                      <p className="text-zinc-500 text-center">
                        {status === "error"
                          ? "Lấy danh sách sinh viên đã nộp thất bại. Vui lòng thử lại sau."
                          : "Không có sinh viên nào đã nộp."}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notSubmitted" className="mt-4">
                <div className="flex flex-col gap-2">
                  {status === "pending" || isFetching ? (
                    <div className="h-fit mx-auto w-fit py-20 flex items-center gap-2">
                      <Spinner />
                      <p className="text-zinc-500">Đang tải danh sách...</p>
                    </div>
                  ) : submittedStudentsData.notSubmittedStudents.length > 0 ? (
                    submittedStudentsData.notSubmittedStudents.map((student) =>
                      renderStudentRow(student)
                    )
                  ) : (
                    <div className="h-fit mx-auto w-fit py-20 flex items-center gap-2">
                      <p className="text-zinc-500 text-center">
                        {status === "error"
                          ? "Lấy danh sách sinh viên chưa nộp thất bại. Vui lòng thử lại sau."
                          : "Không có sinh viên nào chưa nộp."}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <SheetFooter className="mt-6 flex justify-between gap-3">
            <SheetClose asChild>
              <Button variant="outline" size="sm">
                Đóng <Kbd>Esc</Kbd>
              </Button>
            </SheetClose>

            <Button
              variant="default"
              size="sm"
              disabled={!canSubmit || mutationSubmitStudentsGrades.isPending}
              onClick={handleSubmit(onSubmit)}>
              {mutationSubmitStudentsGrades.isPending ? (
                <div className="flex items-center gap-2">
                  <Spinner />
                  <p className="text-zinc-500">Đang lưu...</p>
                </div>
              ) : (
                "Xác nhận điểm"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default React.memo(SheetSubmittedStudents);
