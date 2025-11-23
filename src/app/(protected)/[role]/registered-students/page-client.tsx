"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { AutoAssignStudents } from "@/api-client/auto-assign-students";

import { toast } from "sonner";

import { AxiosError } from "axios";

import { Major } from "@/utils/major";

import { Faculty } from "@/utils/faculty";

import { formatVNDateTime } from "@/utils/format-date-time";

import { generateCohorts, generateYears } from "@/utils/generate-years-cohorts";

const SheetCreateGvhd = React.lazy(
  () => import("@/components/sheet-create-gvhd")
);
const SheetListStudents = React.lazy(
  () => import("@/components/sheet-list-students")
);
const DialogSendNotification = React.lazy(
  () => import("@/components/dialog-send-notification")
);

import { SerializedMajorStats, MajorStatus } from "@/types/registered-students";

import { Button } from "@/components/ui/button";

import { RefreshCw } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

interface PageRegisteredStudentsClientProps {
  initialData: SerializedMajorStats[];
  initialYear: string;
  initialSemester: string;
  initialCohort: string;
}

function PageRegisteredStudentsClient({
  initialData,
  initialYear,
  initialSemester,
  initialCohort,
}: PageRegisteredStudentsClientProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = React.useTransition();

  const [selectedYear, setSelectedYear] = React.useState(initialYear);
  const [selectedSemester, setSelectedSemester] =
    React.useState(initialSemester);
  const [selectedCohort, setSelectedCohort] = React.useState(initialCohort);

  const [isOpenAlertAutoAssignStudents, setIsOpenAlertAutoAssignStudents] =
    React.useState(false);

  React.useEffect(() => {
    setSelectedYear(initialYear);
    setSelectedSemester(initialSemester);
    setSelectedCohort(initialCohort);
  }, [initialYear, initialSemester, initialCohort]);

  const majorStats: SerializedMajorStats[] = React.useMemo(() => {
    return initialData || [];
  }, [initialData]);

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

  const mutationAutoAssignStudents = useMutation({
    mutationFn: AutoAssignStudents,
    onSuccess: (response) => {
      toast.success(response.data.msg);
      router.refresh();
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500)
        toast.error("Chia sinh viên tự động thất bại.");
      else toast.error(error.response.data.msg);
    },
  });

  const majorToFaculty = React.useMemo(() => {
    const map = new Map<string, string>();
    Major.forEach((m) => {
      const faculty = Faculty.find((f) => f.id === m.faculty);
      map.set(m.value, faculty?.value ?? "");
    });
    return map;
  }, []);

  const statusRegistrationTrainingAdvisor = (date: string | null) => {
    if (!date || date === "") {
      return 0;
    }
    const now = new Date();
    const deadline = new Date(date);
    if (now > deadline) {
      return "Đã hết hạn";
    }

    return formatVNDateTime(date);
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex items-center justify-between">
        <p className="font-medium text-lg">Danh sách sinh viên đăng ký môn</p>
        <div className="flex items-center gap-3">
          {majorStats.length > 0 && (
            <>
              <DialogSendNotification
                schoolYear={selectedYear}
                semester={selectedSemester}
                cohort={selectedCohort}
                typeDialog="send-custom-notification-from-bcn"
              />
              <p>|</p>
            </>
          )}

          <Select value={selectedYear} onValueChange={handleYearChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn năm học" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Năm học</SelectLabel>
                {generateYears(2000).map((y: string) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={selectedSemester} onValueChange={handleSemesterChange}>
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

          <Select value={selectedCohort} onValueChange={handleCohortChange}>
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Refresh"
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

      {majorStats.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {majorStats.map((stat: SerializedMajorStats, index: number) => (
              <Popover key={index}>
                <PopoverTrigger>
                  <div
                    className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${"hover:border-blue-300"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm text-gray-700 truncate">
                        {stat.majorName}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {stat.registeredCount}/{stat.totalSlots}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Đã đăng ký:</span>
                        <span className="font-medium text-green-600">
                          {stat.registeredCount}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Còn trống:</span>
                        <span className="font-medium text-blue-600">
                          {stat.remainingSlots}
                        </span>
                      </div>
                      <div className="font-medium text-blue-600 text-xs text-left">
                        {stat.status === MajorStatus.NOT_STARTED ? (
                          <span className="text-blue-600">{stat.status}</span>
                        ) : stat.status === MajorStatus.OPEN ? (
                          <span className="text-green-600">
                            {stat.countMajor > 1
                              ? `Đăng ký đang mở đợt ${stat.countMajor}`
                              : stat.status}
                          </span>
                        ) : stat.status === MajorStatus.ENDED ? (
                          <span className="text-red-600">{stat.status}</span>
                        ) : null}
                      </div>
                      {stat.status === MajorStatus.OPEN && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                (stat.registeredCount / stat.totalSlots) * 100
                              }%`,
                            }}></div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Click để xem chi tiết
                    </div>
                  </div>
                </PopoverTrigger>

                <PopoverContent align="center">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm text-gray-700 truncate">
                      {stat.majorName}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">GVHD:</span>
                        <span className="">{stat.trainingAdvisorCount}</span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Hạn đăng ký GVHD:</span>
                        <span className="">
                          {statusRegistrationTrainingAdvisor(stat.deadline)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                      <SheetCreateGvhd
                        semester={selectedSemester}
                        schoolYear={selectedYear}
                        cohort={selectedCohort}
                        faculty={majorToFaculty.get(stat.majorName) ?? ""}
                      />

                      <SheetListStudents
                        schoolYear={selectedYear}
                        semester={selectedSemester}
                        cohort={selectedCohort}
                        major={stat.majorName}
                      />

                      <AlertDialog
                        open={isOpenAlertAutoAssignStudents}
                        onOpenChange={setIsOpenAlertAutoAssignStudents}>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={mutationAutoAssignStudents.isPending}
                          onClick={() => {
                            if (stat.status !== MajorStatus.ENDED) {
                              setIsOpenAlertAutoAssignStudents(false);
                              toast.warning(
                                "Bạn chỉ có thể chia lớp sinh viên khi đã hết thời gian đăng ký môn."
                              );
                              return;
                            }
                            setIsOpenAlertAutoAssignStudents(true);
                          }}>
                          {mutationAutoAssignStudents.isPending ? (
                            <div className="flex items-center gap-2">
                              <Spinner />
                              Đang chia...
                            </div>
                          ) : (
                            "Chia tự động"
                          )}
                        </Button>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Chia sinh viên tự động
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Sau khi hết thời gian sinh viên đăng ký GVHD (7
                              ngày), BCN có thể chia những sinh viên chưa đăng
                              ký GVHD cho các lớp GVHD còn trống. Bạn có chắc
                              chắn muốn thực hiện hành động này không?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (mutationAutoAssignStudents.isPending)
                                  return;

                                const foundMajor = Major.find(
                                  (m) => m.value === stat.majorName
                                );

                                const faculty = Faculty.find(
                                  (f) => f.id === foundMajor?.faculty
                                );

                                if (!faculty) {
                                  toast.error(
                                    `Không tìm thấy khoa thuộc ngành ${stat.majorName}.`
                                  );
                                  return;
                                }

                                mutationAutoAssignStudents.mutate({
                                  schoolYear: selectedYear,
                                  semester: selectedSemester,
                                  cohort: selectedCohort,
                                  major: stat.majorName,
                                  faculty: faculty.value,
                                });
                              }}>
                              Chia tự động
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
          <p className="text-3xl">{"(>_<)"}</p>
          <p>
            Không có đợt đăng ký nào trong năm học {selectedYear} học kỳ{" "}
            {selectedSemester} khóa {selectedCohort}.
          </p>
        </div>
      )}
    </div>
  );
}

export default React.memo(PageRegisteredStudentsClient);
