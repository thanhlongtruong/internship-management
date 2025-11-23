"use client";

import React from "react";

import { useQuery } from "@tanstack/react-query";

import { GetRegisteredStudents } from "@/api-client/registered-students";

import { RefreshCw } from "lucide-react";

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

import { Button } from "./ui/button";

import { Kbd } from "./ui/kbd";

import { Spinner } from "./ui/spinner";

import { Card, CardHeader, CardTitle, CardDescription } from "./ui/card";

interface IStudent {
  name: string;
  email: string;
}

function SheetListStudents(dataParams: {
  schoolYear: string;
  semester: string;
  cohort: string;
  major: string;
}) {
  const { semester, schoolYear, cohort, major } = dataParams;

  const { data, status, refetch, isFetching } = useQuery({
    queryKey: [schoolYear, semester, cohort, major],
    queryFn: async () => {
      const res = await GetRegisteredStudents(
        schoolYear,
        semester,
        cohort,
        major
      );
      return res.data.students;
    },
  });

  const students = React.useMemo(() => {
    return data as IStudent[];
  }, [data]);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button size="sm">DSSV</Button>
        </SheetTrigger>

        <SheetContent
          onInteractOutside={(e) => e.preventDefault()}
          className="sm:w-full lg:w-96 flex flex-col">
          <SheetHeader>
            <SheetTitle>Danh sách sinh viên</SheetTitle>
            <SheetDescription>
              Danh sách sinh viên đã đăng ký môn học.
            </SheetDescription>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="w-fit self-end">
              <RefreshCw className={`${isFetching && "animate-spin"}`} />
            </Button>
          </SheetHeader>

          <div className="flex flex-col gap-3 px-4 overflow-y-auto flex-1">
            {status === "pending" || isFetching ? (
              <div className="h-fit mx-auto w-fit py-20 flex items-center gap-2">
                <Spinner />
                <p className="text-zinc-500">Đang tải...</p>
              </div>
            ) : students && students.length > 0 ? (
              <div className="flex flex-col gap-3">
                {students.map((student, index) => (
                  <Card key={index}>
                    <CardHeader className="py-3">
                      <CardTitle>{student.name}</CardTitle>
                      <CardDescription>{student.email}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                Danh sách sinh viên trống.
              </div>
            )}
          </div>

          <SheetFooter className="mt-6 flex justify-between gap-3">
            <SheetClose asChild>
              <Button variant="outline" size="sm">
                Đóng <Kbd>Esc</Kbd>
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default React.memo(SheetListStudents);
