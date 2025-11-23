"use client";

import React from "react";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";

import { AxiosError } from "axios";

import {
  SendRequestToAdvisor,
  UndoSendRequestToAdvisor,
} from "@/api-client/notification";

import { generateYears } from "@/utils/generate-years-cohorts";

import {
  SerializedAdvisor,
  SerializedLecturer,
} from "@/types/training-advisors";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

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

import { RefreshCw } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

interface PageAdvisorsClientProps {
  initialData: SerializedAdvisor[];
  initialYear: string;
  initialSemester: string;
}

function PageAdvisorsClient({
  initialData,
  initialYear,
  initialSemester,
}: PageAdvisorsClientProps) {
  const router = useRouter();

  const [isRefreshing, startTransition] = React.useTransition();

  const years = generateYears(2000);

  const [selectedYear, setSelectedYear] = React.useState(initialYear);
  const [selectedSemester, setSelectedSemester] =
    React.useState(initialSemester);

  const [isOpenAlert, setIsOpenAlert] = React.useState(false);
  const [loadingRowId, setLoadingRowId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedYear(initialYear);
    setSelectedSemester(initialSemester);
  }, [initialYear, initialSemester]);

  const advisors: SerializedAdvisor[] = React.useMemo(() => {
    return initialData || [];
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

  const mutateSendRequestToAdvisor = useMutation({
    mutationFn: SendRequestToAdvisor,
    onSuccess: (response) => {
      const { msg } = response.data;
      setLoadingRowId(null);
      toast.success(msg);
      router.refresh();
    },
    onError: (
      error: AxiosError<{ msg: string; action?: string; noti_id?: string }>
    ) => {
      setLoadingRowId(null);
      if (!error?.response || error?.status === 500) {
        toast.error("Gửi yêu cầu thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg, action } = error.response?.data;
        if (action === "undo-send-request-to-advisor") {
          setIsOpenAlert(true);
        }
        toast.error(msg);
      }
    },
  });

  const handleSendRequestToAdvisor = (
    lecturer: SerializedLecturer,
    remainingTime: number
  ) => {
    if (mutateSendRequestToAdvisor.isPending) return;

    if (remainingTime <= 0) {
      toast.error("Đã quá thời gian chọn giảng viên hướng dẫn.");
      return;
    }

    setLoadingRowId(lecturer.email);

    mutateSendRequestToAdvisor.mutate({
      receiver: [lecturer.email],
      yearSchool: selectedYear,
      semester: selectedSemester,
    });
  };

  const mutateUndoSendRequestToAdvisor = useMutation({
    mutationFn: UndoSendRequestToAdvisor,
    onSuccess: (response) => {
      const { msg } = response.data;
      setLoadingRowId(null);
      toast.success(msg);
      router.refresh();
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      setLoadingRowId(null);
      if (!error?.response || error?.status === 500) {
        toast.error("Hủy yêu cầu thất bại. Vui lòng thử lại sau.");
      } else {
        const { msg } = error.response?.data;
        toast.error(msg);
      }
    },
  });

  const columns: ColumnDef<SerializedAdvisor>[] = [
    {
      accessorKey: "lecturerId.name",
      header: "Tên GV",
      cell: ({ row }) => {
        const lecturer = row.original.lecturerId;
        return <div className="capitalize">{lecturer.name}</div>;
      },
    },
    {
      accessorKey: "available",
      header: "SL còn trống",
      cell: ({ row }) => <div>{row.getValue("available")}</div>,
    },
    {
      accessorKey: "maxStudents",
      header: "SL tối đa",
      cell: ({ row }) => <div>{row.getValue("maxStudents")}</div>,
    },
    {
      accessorKey: "remainingTime",
      header: "Thời gian còn lại",
      cell: ({ row }) => {
        const remainingTime = row.getValue("remainingTime") as number;

        if (remainingTime <= 0) {
          return <div className="text-red-500">Đã hết thời gian đăng ký</div>;
        }

        const diffDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
        const diffMinutes = Math.floor((remainingTime / (1000 * 60)) % 60);

        return (
          <div className="text-green-500">{`${diffDays} ngày ${diffHours} giờ ${diffMinutes} phút`}</div>
        );
      },
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const remainingTime = row.getValue("remainingTime") as number;

        if (remainingTime <= 0) {
          return null;
        }

        const lecturer = row.original.lecturerId;

        const isLoading = loadingRowId === lecturer.email;
        return (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={
                mutateSendRequestToAdvisor.isPending ||
                row.original.assignedClasses
              }
              onClick={() => {
                if (row.original.assignedClasses) {
                  toast.warning(
                    `Bạn đã có lớp thực tập trong ${selectedYear} học kỳ ${selectedSemester}.`
                  );
                  return;
                }
                handleSendRequestToAdvisor(lecturer, remainingTime);
              }}>
              {isLoading ? (
                <div className="flex items-center gap-2 text-zinc-500">
                  <Spinner />
                  Đang gửi...
                </div>
              ) : (
                "Gửi yêu cầu"
              )}
            </Button>

            <AlertDialog open={isOpenAlert} onOpenChange={setIsOpenAlert}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận hủy yêu cầu</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có muốn hủy yêu cầu trước đó để gửi cho Giảng viên hướng
                    dẫn mới không?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={mutateUndoSendRequestToAdvisor.isPending}>
                    Hủy
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (mutateUndoSendRequestToAdvisor.isPending) return;
                      const noti_id = (
                        mutateSendRequestToAdvisor.error as unknown as AxiosError<{
                          noti_id: string;
                        }>
                      )?.response?.data.noti_id;
                      if (noti_id) {
                        mutateUndoSendRequestToAdvisor.mutate({
                          noti_id: noti_id,
                        });
                      }
                    }}>
                    {mutateUndoSendRequestToAdvisor.isPending ? (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Spinner />
                        Đang hủy...
                      </div>
                    ) : (
                      "Xác nhận"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        );
      },
    },
  ];

  const table = useReactTable({
    data: advisors,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex flex-col gap-y-6 w-full mt-1">
        <div className="flex items-center justify-between w-full">
          <p className="font-medium text-lg w-fit">
            Đăng ký giảng viên hướng dẫn
          </p>
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

        {!advisors || advisors.length === 0 ? (
          <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
            <p className="text-3xl">{"(>_<)"}</p>
            <p>Không có giảng viên hướng dẫn nào.</p>
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
                    <TableRow key={row.id}>
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
    </>
  );
}

export default React.memo(PageAdvisorsClient);
