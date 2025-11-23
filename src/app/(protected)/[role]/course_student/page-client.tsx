"use client";

import React from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { formatVNDateTime } from "@/utils/format-date-time";

import { countDownDate } from "@/utils/count-down-date";

import { generateYears } from "@/utils/generate-years-cohorts";

const DialogSubmitAssignment = React.lazy(
  () => import("@/components/course_student/dialog-submit-assignment")
);

import {
  SerializedCourseStudentData,
  SerializedAnnouncement,
  SerializedLecturer,
} from "@/types/course-student";

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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";

import { RefreshCw } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";

interface PageCourseStudentClientProps {
  initialData: SerializedCourseStudentData;
  initialYear: string;
  initialSemester: string;
}

function PageCourseStudentClient({
  initialData,
  initialYear,
  initialSemester,
}: PageCourseStudentClientProps) {
  const router = useRouter();

  const [isRefreshing, startTransition] = React.useTransition();
  const years = generateYears(2022);

  const [selectedYear, setSelectedYear] = React.useState(initialYear);
  const [selectedSemester, setSelectedSemester] =
    React.useState(initialSemester);
  const [activeTab, setActiveTab] = React.useState("assignments");

  React.useEffect(() => {
    setSelectedYear(initialYear);
    setSelectedSemester(initialSemester);
  }, [initialYear, initialSemester]);

  const assignments: SerializedAnnouncement[] = React.useMemo(() => {
    return initialData?.announcements || [];
  }, [initialData]);

  const lecturer: SerializedLecturer | null = React.useMemo(() => {
    return initialData?.lecturer || null;
  }, [initialData]);

  const idAdvisorGroup: string = React.useMemo(() => {
    return initialData?.id || "";
  }, [initialData]);

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    updateURL(value, selectedSemester);
  };

  const handleSemesterChange = (value: string) => {
    setSelectedSemester(value);
    updateURL(selectedYear, value);
  };

  const updateURL = (year: string, semester: string) => {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (semester) params.set("semester", semester);
    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(newUrl, { scroll: false });
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-y-6 w-full mt-1">
      <div className="flex items-center justify-between w-full">
        <p className="font-medium text-lg w-fit">Lớp thực tập</p>
        <div className="flex items-center gap-3 w-fit">
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

          <Select value={selectedSemester} onValueChange={handleSemesterChange}>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="assignments">Assignment</TabsTrigger>
          <TabsTrigger value="lecturer">Giảng viên hướng dẫn</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-4">
          {assignments.length === 0 ? (
            <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
              <p className="text-3xl">{"(>_<)"}</p>
              <p>
                Chưa có thông báo hay bài tập nào cho học kỳ {selectedSemester}{" "}
                năm {selectedYear}.
              </p>
            </div>
          ) : (
            <Accordion
              type="single"
              collapsible
              className="grid gap-4 md:grid-cols-2 w-full">
              {assignments.map((a, idx) => (
                <Card key={`${a._id}-${idx}`} className="flex flex-1 flex-row">
                  <AccordionItem value={`${a._id}-${idx}`} className="w-full">
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

                        <CardDescription>
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
                        {a.announcements_type === "internship_form" && (
                          <div className="space-y-3">
                            <RadioGroup>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="internship_company"
                                  id="internship_company"
                                />
                                <Label
                                  htmlFor="internship_company"
                                  className="text-sm text-zinc-800">
                                  Thực tập tại công ty.
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="internship_replacement"
                                  id="internship_replacement"
                                />
                                <Label
                                  htmlFor="internship_replacement"
                                  className="text-sm text-zinc-800">
                                  Làm đồ án thay thế.
                                </Label>
                              </div>
                            </RadioGroup>

                            <div className="w-full mt-4 flex items-center justify-end">
                              <Button size="sm" className="w-fit">
                                Xác nhận
                              </Button>
                            </div>
                          </div>
                        )}

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
                                              new Date(t.deadline) < new Date()
                                                ? "text-red-500"
                                                : "text-green-500"
                                            }`}>
                                            Hạn: {formatVNDateTime(t.deadline)}
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

                                      <div className="pl-13 mt-4 flex flex-col items-start justify-start">
                                        {t.hasSubmitted &&
                                          t.filesSubmitted.length > 0 && (
                                            <div>
                                              <p className="text-sm font-medium mb-1.5">
                                                Các file đã nộp:
                                              </p>
                                              <div className="text-sm flex flex-col items-start justify-start gap-2">
                                                {t.filesSubmitted.map(
                                                  (s, idx) => (
                                                    <Link
                                                      key={`${s.url}-${idx}`}
                                                      href={s.url}
                                                      target="_blank"
                                                      className="hover:underline line-clamp-1">
                                                      {idx + 1}. {s.name}
                                                    </Link>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}

                                        <div className="w-full mt-4 flex items-center justify-end">
                                          <DialogSubmitAssignment
                                            idAdvisorGroup={idAdvisorGroup}
                                            idAssignment={a._id}
                                            idTitle={t._id}
                                            titleName={t.title_name}
                                            hasSubmitted={t.hasSubmitted}
                                            deadline={t.deadline}
                                          />
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </div>
                          )}
                      </CardContent>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="lecturer" className="mt-4">
          {!lecturer ? (
            <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
              <p className="text-3xl">{"(>_<)"}</p>
              <p>
                Giảng viên hướng dẫn trong lớp học kỳ {selectedSemester} năm{" "}
                {selectedYear} không tìm thấy thông tin.
              </p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  <p className="pt-4">Thông tin giảng viên hướng dẫn</p>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 pb-4">
                  <p className="text-base">Email: {lecturer?.email}</p>
                  <p className="text-base">Tên: {lecturer?.name}</p>
                  <p className="text-base">Khoa: {lecturer?.faculty}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default React.memo(PageCourseStudentClient);
