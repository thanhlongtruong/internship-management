"use client";

import React from "react";

import { useRouter } from "next/navigation";

import Link from "next/link";

import { useMutation } from "@tanstack/react-query";

import { AxiosError } from "axios";

import { formatVNDateTime } from "@/utils/format-date-time";

import { TypesUser } from "@/store/use-user-store";

import { DeleteAssignment } from "@/api-client/course-advisor";

import { useStatePopupInfoUser } from "@/store/use-state-popup-info-user";

import { generateYears, generateCohorts } from "@/utils/generate-years-cohorts";

import {
  SerializedCourseAdvisorData,
  SerializedStudent,
  SerializedAnnouncement,
} from "@/types/course-advisor";

import { countDownDate } from "@/utils/count-down-date";

const DialogCreateAssignment = React.lazy(
  () => import("@/components/course_advisor/dialog-create-assignment")
);

const DialogUpdateAssignment = React.lazy(
  () => import("@/components/course_advisor/dialog-update-assignment")
);

const SheetSubmittedStudents = React.lazy(
  () => import("@/components/course_advisor/sheet-submitted-students")
);

const DialogSendNotification = React.lazy(
  () => import("@/components/dialog-send-notification")
);

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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";

import { MoreHorizontal, Pencil, RefreshCw, Trash } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface PageCourseAdvisorClientProps {
  initialData: SerializedCourseAdvisorData | "not-advisor";
  initialYear: string;
  initialSemester: string;
  initialCohort: string;
}

function PageCourseAdvisorClient({
  initialData,
  initialYear,
  initialSemester,
  initialCohort,
}: PageCourseAdvisorClientProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = React.useTransition();

  const { setStore } = useStatePopupInfoUser();

  const years = generateYears(2000);
  const cohorts = generateCohorts(2020);

  const [isOpenDialogUpdateAssignment, setIsOpenDialogUpdateAssignment] =
    React.useState(false);

  const [selectedAnnouncementData, setSelectedAnnouncementData] =
    React.useState<SerializedAnnouncement | null>(null);

  const [
    selectedAnnouncementDataToDelete,
    setSelectedAnnouncementDataToDelete,
  ] = React.useState<SerializedAnnouncement | null>(null);

  const [selectedYear, setSelectedYear] = React.useState(initialYear);

  const [selectedSemester, setSelectedSemester] =
    React.useState(initialSemester);

  const [selectedCohort, setSelectedCohort] = React.useState(initialCohort);

  const [openAlertDeleteAssignment, setOpenAlertDeleteAssignment] =
    React.useState(false);

  const [activeTab, setActiveTab] = React.useState("assignments");

  React.useEffect(() => {
    setSelectedYear(initialYear);
    setSelectedSemester(initialSemester);
    setSelectedCohort(initialCohort);
  }, [initialYear, initialSemester, initialCohort]);

  const students: SerializedStudent[] = React.useMemo(() => {
    return initialData !== "not-advisor" ? initialData?.students || [] : [];
  }, [initialData]);

  const announcements: SerializedAnnouncement[] = React.useMemo(() => {
    return initialData !== "not-advisor"
      ? initialData?.announcements || []
      : [];
  }, [initialData]);

  const idAdvisorGroup: string = React.useMemo(() => {
    return initialData !== "not-advisor" ? initialData?.id || "" : "";
  }, [initialData]);

  const mutationDeleteAssignment = useMutation({
    mutationFn: DeleteAssignment,
    onSuccess: (response) => {
      const { msg } = response.data;
      toast.success(msg);
      startTransition(() => {
        router.refresh();
      });
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Xóa assignment thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const handleDeleteAssignment = (idAnnouncement: string) => {
    if (mutationDeleteAssignment.isPending) return;

    if (!idAdvisorGroup) {
      toast.error("Không tìm thấy dữ liệu của lớp thực tập.");
      return;
    }

    if (!idAnnouncement) {
      toast.error("Không tìm thấy assignment cần xóa.");
      return;
    }

    toast.promise(
      mutationDeleteAssignment.mutateAsync({ idAdvisorGroup, idAnnouncement }),
      {
        loading: "Đang xóa...",
      }
    );
  };

  const handleOpenAlertDeleteAssignment = (
    open: boolean,
    announcementData: SerializedAnnouncement
  ) => {
    if (mutationDeleteAssignment.isPending) return;
    if (!open) {
      setSelectedAnnouncementDataToDelete(null);
    } else {
      setSelectedAnnouncementDataToDelete(announcementData);
    }
    setOpenAlertDeleteAssignment(open);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    updateURL(value, selectedSemester, selectedCohort);
  };

  const handleSemesterChange = (value: string) => {
    setSelectedSemester(value);
    updateURL(selectedYear, value, selectedCohort);
  };

  const handleCohortChange = (value: string) => {
    setSelectedCohort(value);
    updateURL(selectedYear, selectedSemester, value);
  };

  const updateURL = (year: string, semester: string, cohort: string) => {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (semester) params.set("semester", semester);
    if (cohort) params.set("cohort", cohort);
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(newUrl, { scroll: false });
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleOpenDialogUpdateAssignment = (
    announcementData: SerializedAnnouncement
  ) => {
    setSelectedAnnouncementData(announcementData);

    setIsOpenDialogUpdateAssignment(true);
  };

  return (
    <>
      <div className="flex flex-col gap-y-6 w-full mt-1">
        <div className="flex items-center justify-between w-full">
          <p className="font-medium text-lg w-fit">Lớp thực tập</p>
          <div className="flex items-center gap-3 w-fit">
            {initialData !== "not-advisor" && (
              <>
                <DialogSendNotification
                  schoolYear={selectedYear}
                  semester={selectedSemester}
                  cohort={selectedCohort}
                  typeDialog="send-custom-notification-from-advisor"
                />
                <DialogCreateAssignment idAdvisorGroup={idAdvisorGroup} />
                <p>|</p>
              </>
            )}

            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn năm học" />
              </SelectTrigger>
              <SelectContent className="w-fit">
                <SelectGroup>
                  <SelectLabel>Năm học</SelectLabel>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={selectedSemester}
              onValueChange={handleSemesterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn học kỳ" />
              </SelectTrigger>
              <SelectContent className="w-fit">
                <SelectGroup>
                  <SelectLabel>Học kỳ</SelectLabel>
                  <SelectItem value="1">Học kỳ 1</SelectItem>
                  <SelectItem value="2">Học kỳ 2</SelectItem>
                  <SelectItem value="3">Học kỳ 3</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={selectedCohort} onValueChange={handleCohortChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn khóa" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Khóa</SelectLabel>
                  {cohorts.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Submit"
                  onClick={handleRefresh}
                  disabled={isRefreshing}>
                  <RefreshCw className={`${isRefreshing && "animate-spin"}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tải lại</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {initialData === "not-advisor" ? (
          <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
            <p className="text-3xl">{"(>_<)"}</p>
            <p>
              Bạn không phải giáo viên hướng dẫn trong {selectedYear} học kỳ{" "}
              {selectedSemester} khóa {selectedCohort}.
            </p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full">
            <TabsList>
              <TabsTrigger value="assignments">Assignment</TabsTrigger>
              <TabsTrigger value="students">Danh sách sinh viên</TabsTrigger>
            </TabsList>

            <TabsContent value="assignments" className="mt-4">
              {announcements.length === 0 ? (
                <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
                  <p className="text-3xl">{"(>_<)"}</p>
                  <p>
                    Chưa có thông báo hay bài tập nào cho học kỳ{" "}
                    {selectedSemester} năm {selectedYear}.
                  </p>
                  <DialogCreateAssignment idAdvisorGroup={idAdvisorGroup} />
                </div>
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  className="grid gap-4 md:grid-cols-2 w-full">
                  {announcements.map((a, idx) => (
                    <Card
                      key={`${a._id}-${idx}`}
                      className="flex flex-1 flex-row">
                      <AccordionItem
                        value={`${a._id}-${idx}`}
                        className="w-full">
                        <AccordionTrigger>
                          <CardHeader className="flex flex-col flex-1 items-start space-y-0">
                            <div className="w-full flex flex-row items-center justify-between space-y-0">
                              <div>
                                <CardTitle className="text-base">
                                  {a.topic}
                                </CardTitle>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    a.announcements_type === "assignment" ||
                                    a.announcements_type === "internship_form"
                                      ? "default"
                                      : "secondary"
                                  }>
                                  {a.announcements_type === "assignment" ||
                                  a.announcements_type === "internship_form"
                                    ? "Bài tập"
                                    : "Chung"}
                                </Badge>
                              </div>
                            </div>

                            <CardDescription className="text-sm text-muted-foreground">
                              {a.description_topic}

                              {a.files && a.files?.length > 0 && (
                                <div className="mt-3">
                                  <h4 className="text-sm font-medium mb-1.5 text-zinc-700">
                                    Các file đính kèm:
                                  </h4>
                                  <div className="text-sm flex flex-col items-start justify-start gap-2">
                                    {a.files
                                      .filter((f) => f.url && f.name)
                                      .map((f, idx) => (
                                        <Link
                                          key={`${f.url}-${idx}`}
                                          href={f.url}
                                          target="_blank"
                                          className="hover:underline line-clamp-1">
                                          {idx + 1}. {f.name}
                                        </Link>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </CardDescription>
                          </CardHeader>
                        </AccordionTrigger>

                        <AccordionContent>
                          <CardContent className="space-y-3">
                            {a.announcements_type === "assignment" &&
                              a.title?.length > 0 && (
                                <div className="space-y-3">
                                  <Accordion type="single" collapsible>
                                    {a.title.map((t, idx) => (
                                      <AccordionItem
                                        key={`${t._id}-${idx}`}
                                        value={`${t._id}-${idx}`}>
                                        <AccordionTrigger>
                                          <div className="flex flex-col items-start justify-start">
                                            <div className="pl-2 font-medium text-base">
                                              {idx + 1}. {t.title_name}
                                            </div>
                                            {!!t.deadline && (
                                              <div
                                                className={`pl-2 text-xs font-medium ${
                                                  new Date(t.deadline) <
                                                  new Date()
                                                    ? "text-red-500"
                                                    : "text-green-500"
                                                }`}>
                                                Hạn:{" "}
                                                {formatVNDateTime(t.deadline)}
                                                {" - "}
                                                {countDownDate(t.deadline)}
                                              </div>
                                            )}
                                          </div>
                                        </AccordionTrigger>

                                        <AccordionContent>
                                          {!!t.content && (
                                            <div className="pl-8 text-sm text-zinc-700">
                                              {t.content}
                                            </div>
                                          )}
                                          {t.files && t.files?.length > 0 && (
                                            <div className="pl-8 mt-3">
                                              <h4 className="text-sm font-medium mb-1.5">
                                                Các file đính kèm:
                                              </h4>
                                              <div className="text-sm flex flex-col items-start justify-start gap-2">
                                                {t.files
                                                  .filter(
                                                    (f) => f.url && f.name
                                                  )
                                                  .map((f, idx) => (
                                                    <Link
                                                      key={`${f.url}-${idx}`}
                                                      href={f.url}
                                                      target="_blank"
                                                      className="hover:underline line-clamp-1">
                                                      {idx + 1}. {f.name}
                                                    </Link>
                                                  ))}
                                              </div>
                                            </div>
                                          )}

                                          <div className="pl-8 mt-4">
                                            <SheetSubmittedStudents
                                              idAdvisorGroup={idAdvisorGroup}
                                              idAnnouncement={a._id}
                                              idTitle={t._id}
                                              deadline={t.deadline}
                                            />
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    ))}
                                  </Accordion>
                                </div>
                              )}
                            <div className="text-xs text-muted-foreground flex flex-col gap-1">
                              <span>
                                Tạo lúc: {formatVNDateTime(a.createdAt)}
                              </span>
                            </div>
                          </CardContent>
                        </AccordionContent>
                      </AccordionItem>

                      <div className="flex flex-col items-start gap-2 mt-1 mr-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => handleOpenDialogUpdateAssignment(a)}>
                          <Pencil />
                        </Button>

                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          onClick={() =>
                            handleOpenAlertDeleteAssignment(true, a)
                          }>
                          <Trash />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="students" className="mt-4">
              {students.length === 0 ? (
                <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
                  <p className="text-3xl">{"(>_<)"}</p>
                  <p>
                    Chưa có sinh viên nào trong lớp học kỳ {selectedSemester}{" "}
                    năm {selectedYear}.
                  </p>
                </div>
              ) : (
                <Card>
                  <CardHeader className="pt-3">
                    <CardTitle>
                      Danh sách sinh viên ({students.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Họ tên</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Ngành</TableHead>
                          <TableHead>Khóa</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((s, idx) => (
                          <TableRow key={`${s.email}-${idx}`}>
                            <TableCell className="font-medium">
                              {s.name}
                            </TableCell>
                            <TableCell>{s.email}</TableCell>
                            <TableCell>{s.major}</TableCell>
                            <TableCell>{s.cohort}</TableCell>
                            <TableCell className="w-0">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Actions">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-40">
                                  <DropdownMenuLabel>
                                    Thao tác
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setStore({
                                        ...s,
                                        _id: `${s.email}-${idx}`,
                                        exp: 0,
                                        pdt: "",
                                      } as TypesUser);
                                    }}>
                                    Thông tin
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {selectedAnnouncementData && isOpenDialogUpdateAssignment && (
        <DialogUpdateAssignment
          idAdvisorGroup={idAdvisorGroup}
          AnnouncementData={selectedAnnouncementData}
          isOpen={isOpenDialogUpdateAssignment}
          onOpenChange={(open) => {
            setIsOpenDialogUpdateAssignment(open);
            if (!open) {
              setSelectedAnnouncementData(null);
            }
          }}
        />
      )}

      {selectedAnnouncementDataToDelete && (
        <AlertDialog
          open={openAlertDeleteAssignment}
          onOpenChange={setOpenAlertDeleteAssignment}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Xác nhận xóa {selectedAnnouncementDataToDelete.topic}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa chủ đề này không? Tất cả bài tập trong
                chủ đề này sẽ bị xóa.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={mutationDeleteAssignment.isPending}>
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={mutationDeleteAssignment.isPending}
                onClick={() =>
                  handleDeleteAssignment(selectedAnnouncementDataToDelete._id)
                }>
                {mutationDeleteAssignment.isPending ? (
                  <div className="flex items-center gap-2">
                    <Spinner />
                    Đang xóa...
                  </div>
                ) : (
                  "Xóa"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

export default React.memo(PageCourseAdvisorClient);
