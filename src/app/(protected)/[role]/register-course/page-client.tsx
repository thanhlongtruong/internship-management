"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { AxiosError } from "axios";

import { RegisterCourse } from "@/api-client/register-course";

import { SerializedOpenRegistration } from "@/types/open-registration";

import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";

import { Button } from "@/components/ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Label } from "@/components/ui/label";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { RefreshCw } from "lucide-react";

interface PageRegisterCourseClientProps {
  course: SerializedOpenRegistration | null;
}

function PageRegisterCourseClient({
  course: initialCourse,
}: PageRegisterCourseClientProps) {
  const router = useRouter();

  const [isRefreshing, startTransition] = React.useTransition();

  const [selectedMajor, setSelectedMajor] = React.useState("");

  const course: SerializedOpenRegistration | null = React.useMemo(() => {
    if (!initialCourse) return null;
    return initialCourse;
  }, [initialCourse]);

  const mutationRegistration = useMutation({
    mutationFn: RegisterCourse,
    onSuccess: (response) => {
      const { msg } = response.data;
      toast.success(msg);
      router.refresh();
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500) {
        toast.error("Đăng ký thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const handleRegisterCourse = (major: string) => {
    if (mutationRegistration.isPending) return;
    if (!major) return toast.warning("Bạn chưa chọn ngành.");

    if (!course) return toast.error("Không tìm thấy đợt đăng ký thực tập.");

    mutationRegistration.mutate({ major, courseId: course._id });
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-y-6 w-full mt-1">
      <div className="flex items-center justify-between w-full">
        <p className="font-medium text-lg w-fit">Đăng ký thực tập</p>
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

      {!course && (
        <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
          <p className="text-3xl">{"(>_<)"}</p>
          <p>Chưa đến thời gian đăng ký thực tập.</p>
        </div>
      )}

      {course && (
        <div className="border">
          <p className="border-b px-3 py-2 font-semibold text-lg">
            Thực tập công nghiệp khóa {course.cohort}, học kỳ {course.semester},
            năm {course.schoolYear}
          </p>

          <RadioGroup
            value={selectedMajor}
            onValueChange={setSelectedMajor}
            aria-label="Chọn ngành thực tập">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/6 text-center">Chọn</TableHead>
                  <TableHead className="w-2/4">Ngành</TableHead>
                  <TableHead className="w-1/4">SL còn lại</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {course.major.map((m, index) => {
                  const id = `major-${index}`;
                  return (
                    <TableRow
                      key={m.name}
                      onClick={() => document.getElementById(id)?.click()}
                      className="cursor-pointer">
                      <TableCell className="text-center">
                        <RadioGroupItem value={m.name} id={id} />
                      </TableCell>

                      <TableCell className="text-center">
                        <Label htmlFor={id} className="cursor-pointer">
                          {m.name}
                        </Label>
                      </TableCell>

                      <TableCell className="text-right">
                        <Label htmlFor={id} className="cursor-pointer">
                          {m.quantity - m.used}
                        </Label>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>
                    <div className="flex justify-end">
                      {mutationRegistration.isPending ? (
                        <Button variant="outline" disabled size="sm">
                          <Spinner />
                          Đang đăng ký
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleRegisterCourse(selectedMajor)}
                          disabled={
                            !selectedMajor || mutationRegistration.isPending
                          }>
                          Đăng ký
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}

export default React.memo(PageRegisterCourseClient);
