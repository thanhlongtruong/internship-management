"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { DeleteOpenRegistration } from "@/api-client/open-registration";

import { formatVNDateTime } from "@/utils/format-date-time";

import { AxiosError } from "axios";

import { generateYears, generateCohorts } from "@/utils/generate-years-cohorts";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import { SerializedOpenRegistration } from "@/lib/get-open-registration-server";

const DialogOpenRegistration = React.lazy(
  () => import("@/components/dialog-open-registration")
);
const DialogUpdateOpenRegistration = React.lazy(
  () => import("@/components/dialog-update-registration")
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

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import { MoreHorizontal, RefreshCw } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageOpenCourseClientProps {
  initialCourses: SerializedOpenRegistration[];
  initialYear: string;
  initialSemester: string;
  initialCohort: string;
}

function PageOpenCourseClient({
  initialCourses,
  initialYear,
  initialSemester,
  initialCohort,
}: PageOpenCourseClientProps) {
  const router = useRouter();

  const years = generateYears(2000);
  const cohorts = generateCohorts(2020);

  const [selectedYear, setSelectedYear] = React.useState(initialYear);
  const [selectedSemester, setSelectedSemester] =
    React.useState(initialSemester);
  const [selectedCohort, setSelectedCohort] = React.useState(initialCohort);

  React.useEffect(() => {
    setSelectedYear(initialYear);
    setSelectedSemester(initialSemester);
    setSelectedCohort(initialCohort);
  }, [initialYear, initialSemester, initialCohort]);

  const courses: SerializedOpenRegistration[] = React.useMemo(() => {
    return initialCourses.map((course) => ({
      _id: course._id,
      timeStart: course.timeStart,
      timeEnd: course.timeEnd,
      semester: course.semester,
      schoolYear: course.schoolYear,
      cohort: course.cohort,
      major: course.major as [{ name: string; quantity: number; used: number }],
    }));
  }, [initialCourses]);

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const [rowSelection, setRowSelection] = React.useState({});

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

  const mutationDeleteRegistration = useMutation({
    mutationFn: DeleteOpenRegistration,
    onSuccess: () => {
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

  const handleDeleteOpenRegistration = async (courseId: string) => {
    if (mutationDeleteRegistration.isPending) return;
    toast.promise(mutationDeleteRegistration.mutateAsync(courseId), {
      loading: "Đang xóa...",
      success: "Xóa thành công",
      error: "Xóa thất bại",
    });
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const columns: ColumnDef<SerializedOpenRegistration>[] = [
    {
      id: "stt",
      header: "STT",
      cell: ({ row }) => <div className="capitalize">{row.index + 1}</div>,
    },
    {
      accessorKey: "timeStart",
      header: "TG bắt đầu",
      cell: ({ row }) => (
        <div>{formatVNDateTime(row.getValue("timeStart"))}</div>
      ),
    },
    {
      accessorKey: "timeEnd",
      header: "TG kết thúc",
      cell: ({ row }) => <div>{formatVNDateTime(row.getValue("timeEnd"))}</div>,
    },
    {
      accessorKey: "major",
      header: "Ngành",
      cell: ({ row }) => {
        const majors = row.getValue("major") as {
          name: string;
          quantity: number;
        }[];
        return (
          <ul className="space-y-2 break-words whitespace-normal max-w-[300px]">
            {majors.map((m) => (
              <li key={m.name}>{`${m.name} (SL: ${m.quantity})`}</li>
            ))}
          </ul>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const timeStart = new Date(row.getValue("timeStart"));
        const timeEnd = new Date(row.getValue("timeEnd"));
        const now = new Date();

        let status = "";
        let color = "";
        if (now < timeStart) {
          status = "Chưa đến thời gian đăng ký";
          color = "text-blue-500";
        } else if (now >= timeStart && now <= timeEnd) {
          status = "Đăng ký đang mở";
          color = "text-green-600 font-medium";
        } else {
          status = "Đã qua thời gian đăng ký";
          color = "text-red-500";
        }
        return (
          <div
            className={`break-words whitespace-normal max-w-[200px] ${color}`}>
            {status}
          </div>
        );
      },
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const course = row.original;

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-fit">
                <DropdownMenuLabel>Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={(e) => e.preventDefault()}>
                  <DialogUpdateOpenRegistration
                    courseId={course._id}
                    dataCourse={{
                      timeStart: new Date(course.timeStart),
                      timeEnd: new Date(course.timeEnd),
                      major: course.major,
                      semester: course.semester,
                      schoolYear: course.schoolYear,
                      cohort: course.cohort,
                    }}
                  />
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer text-red-500"
                  disabled={mutationDeleteRegistration.isPending}
                  onSelect={(e) => {
                    e.preventDefault();
                  }}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div className="flex items-center w-full">Xóa</div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Đồng nghĩa tất cả sinh viên đã đăng ký sẽ bị xóa khỏi
                          danh sách đăng ký. Bạn không thể xóa khi đăng ký đang
                          mở.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          disabled={mutationDeleteRegistration.isPending}>
                          Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                          disabled={mutationDeleteRegistration.isPending}
                          onClick={() => {
                            if (mutationDeleteRegistration.isPending) return;
                            const now = new Date();
                            const start = new Date(course.timeStart);
                            const end = new Date(course.timeEnd);
                            if (now >= start && now <= end) {
                              toast.error(
                                "Bạn không thể xóa khi đăng ký đang mở."
                              );
                              return;
                            }
                            handleDeleteOpenRegistration(course._id);
                          }}>
                          {mutationDeleteRegistration.isPending ? (
                            <div className="flex items-center gap-2">
                              <Spinner /> Đang xóa...
                            </div>
                          ) : (
                            "Xóa"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        );
      },
    },
  ];

  const table = useReactTable({
    data: courses,
    columns: columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="flex flex-col gap-y-6 w-full mt-1">
      <div className="flex items-center justify-between w-full">
        <p className="font-medium text-lg w-fit">Lịch sử đã tạo đăng ký</p>
        <div className="flex items-center gap-3 w-fit">
          <DialogOpenRegistration />
          <p>|</p>
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
                aria-label="Refresh"
                onClick={handleRefresh}
                disabled={mutationDeleteRegistration.isPending}>
                <RefreshCw
                  className={`${
                    mutationDeleteRegistration.isPending && "animate-spin"
                  }`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tải lại</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {!courses || courses.length === 0 ? (
        <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
          <p className="text-3xl">{"(>_<)"}</p>
          <p>
            Bạn chưa mở đăng ký thực tập nào trong học kỳ {selectedSemester} năm{" "}
            {selectedYear}.
          </p>
        </div>
      ) : (
        <>
          <Table className="z-10">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table?.getRowModel()?.rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Không có kết quả.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

export default React.memo(PageOpenCourseClient);
