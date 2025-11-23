"use client";

import React, { useState, useCallback, useRef } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import { toast } from "sonner";

import { AxiosError } from "axios";

import { GetGVCombineWithAdvisor } from "@/api-client/pdt";

import { TypesUser } from "@/store/use-user-store";

import { formatVNDateTime } from "@/utils/format-date-time";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

import { Label } from "./ui/label";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

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

import { Spinner } from "@/components/ui/spinner";

import {
  flexRender,
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";

import { CreateTrainingAdvisor } from "@/api-client/training-advisor";

import { Checkbox } from "./ui/checkbox";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { Kbd } from "./ui/kbd";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogClose,
  DialogTrigger,
} from "./ui/dialog";

interface IAdvisorAssigned {
  faculty: string;
  maxStudents: number;
  studentSelectDeadline: string;
  createdAt: string;
  lecturer: TypesUser;
  assignedStudents: number;
  students: number;
}

function SheetCreateGVHD(dataParams: {
  semester: string;
  schoolYear: string;
  cohort: string;
  faculty: string;
}) {
  const { semester, schoolYear, cohort, faculty } = dataParams;

  const [pageAssigned, setPageAssigned] = useState(1);

  const [pageUnassigned, setPageUnassigned] = useState(1);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    faculty: false,
  });

  const selectedLecturersRef = useRef<{
    [email: string]: { lecturer: TypesUser; maxStudents: number };
  }>({});

  const [selectedLecturersView, setSelectedLecturersView] = useState<{
    [email: string]: { lecturer: TypesUser; maxStudents: number };
  }>({});

  // ====================== API CALLS ======================

  const {
    data: data_assigned,
    status: status_assigned,
    refetch: refetch_assigned,
    isFetching: isFetching_assigned,
  } = useQuery({
    queryKey: [
      "advisors",
      "assigned",
      faculty,
      schoolYear,
      semester,
      cohort,
      pageAssigned,
    ],
    queryFn: async () => {
      if (!faculty) return Promise.resolve(null);

      const res = await GetGVCombineWithAdvisor(
        pageAssigned,
        faculty,
        schoolYear,
        semester,
        cohort,
        "assigned"
      );
      return {
        assigned: res.data.assigned as IAdvisorAssigned[],
        totalAssigned: res.data.totalAssigned,
        totalPageAssigned: res.data.totalPageAssigned,
        page: res.data.page,
        pageSize: res.data.pageSize,
      };
    },
    enabled: !!faculty,
    refetchOnWindowFocus: false,
  });

  const {
    data: data_unassigned,
    status: status_unassigned,
    refetch: refetch_unassigned,
    isFetching: isFetching_unassigned,
  } = useQuery({
    queryKey: [
      "advisors",
      "unassigned",
      faculty,
      schoolYear,
      semester,
      cohort,
      pageUnassigned,
    ],
    queryFn: async () => {
      if (!faculty) return Promise.resolve(null);

      const res = await GetGVCombineWithAdvisor(
        pageUnassigned,
        faculty,
        schoolYear,
        semester,
        cohort,
        "unassigned"
      );
      return {
        unassigned: res.data.unassigned as TypesUser[],
        totalUnassigned: res.data.totalUnassigned,
        totalPageUnassigned: res.data.totalPageUnassigned,
        page: res.data.page,
        pageSize: res.data.pageSize,
      };
    },
    enabled: !!faculty,
    refetchOnWindowFocus: false,
  });

  const mutationCreateTrainingAdvisor = useMutation({
    mutationFn: CreateTrainingAdvisor,
    onSuccess: (response) => {
      refetch_unassigned();
      refetch_assigned();
      setRowSelection({});
      setSelectedLecturersView({});
      selectedLecturersRef.current = {};
      toast.success(response.data.msg);
    },
    onError: (error: AxiosError<{ msg: string }>) => {
      if (!error?.response || error?.status === 500)
        toast.error("Phân công giảng viên hướng dẫn thất bại.");
      else toast.error(error.response.data.msg);
    },
  });

  // ====================== TABLE CONFIG ======================

  const columnsUnassigned: ColumnDef<TypesUser>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Họ tên",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "faculty",
      header: "Khoa",
      cell: ({ row }) => <div>{row.getValue("faculty")}</div>,
    },

    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const lecturer = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Dialog>
                  <DialogTrigger>Thông tin</DialogTrigger>
                  <DialogContent
                    className="max-w-sm"
                    onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                      <DialogTitle>Thông tin giảng viên</DialogTitle>
                    </DialogHeader>
                    <div className="w-full flex flex-col gap-3">
                      <p>Email: {lecturer?.email}</p>
                      <div className="flex flex-wrap gap-3">
                        <p>Giới tính: {lecturer?.gender}</p>
                        <p>|</p>
                        <p>Ngày sinh: {lecturer?.birthday}</p>
                      </div>
                      <p>Trường: {lecturer?.school}</p>

                      <p>Khoa: {lecturer?.faculty}</p>
                    </div>
                    <DialogFooter className="sm:justify-end">
                      <DialogClose asChild>
                        <Button type="button" size="sm">
                          Đóng <Kbd className="text-zinc-500">Esc</Kbd>
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const columnsAssigned: ColumnDef<IAdvisorAssigned>[] = [
    {
      accessorKey: "name",
      header: "Họ tên",
      cell: ({ row }) => {
        const lecturer = row.original.lecturer;
        return <div className="capitalize">{lecturer.name}</div>;
      },
    },

    {
      accessorKey: "assignedStudents",
      header: "SL đã gửi",
      cell: ({ row }) => <div>{row.original.assignedStudents}</div>,
    },
    {
      accessorKey: "students",
      header: "SL đã nhận",
      cell: ({ row }) => <div>{row.original.students}</div>,
    },
    {
      accessorKey: "maxStudents",
      header: "SL tối đa",
      cell: ({ row }) => <div>{row.original.maxStudents}</div>,
    },
    {
      accessorKey: "studentSelectDeadline",
      header: "Hạn đăng ký",
      cell: ({ row }) => (
        <div>{formatVNDateTime(row.original.studentSelectDeadline)}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const lecturer = row.original.lecturer;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Dialog>
                  <DialogTrigger>Thông tin</DialogTrigger>
                  <DialogContent
                    className="max-w-sm"
                    onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                      <DialogTitle>Thông tin giảng viên</DialogTitle>
                    </DialogHeader>
                    <div className="w-full flex flex-col gap-3">
                      <p>Email: {lecturer?.email}</p>
                      <div className="flex flex-wrap gap-3">
                        <p>Giới tính: {lecturer?.gender}</p>
                        <p>|</p>
                        <p>Ngày sinh: {lecturer?.birthday}</p>
                      </div>
                      <p>Trường: {lecturer?.school}</p>

                      <p>Khoa: {lecturer?.faculty}</p>
                    </div>
                    <DialogFooter className="sm:justify-end">
                      <DialogClose asChild>
                        <Button type="button" size="sm">
                          Đóng <Kbd className="text-zinc-500">Esc</Kbd>
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const tableUnassigned = useReactTable({
    data: data_unassigned?.unassigned || [],
    columns: columnsUnassigned,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: (row) => row.email,
    state: {
      columnVisibility,
      rowSelection,
    },
  });

  const tableAssigned = useReactTable({
    data: data_assigned?.assigned || [],
    columns: columnsAssigned,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  });

  // ====================== SELECTION HANDLING ======================

  React.useEffect(() => {
    const selectedEmails = Object.keys(rowSelection).filter(
      (k) => rowSelection[k]
    );
    const currentLecturers = data_unassigned?.unassigned || [];
    if (!currentLecturers?.length) return;

    const newState = { ...selectedLecturersRef.current };

    // Thêm giảng viên mới
    selectedEmails.forEach((email) => {
      if (!newState[email]) {
        const lecturer = currentLecturers.find((l) => l.email === email);
        if (lecturer) newState[email] = { lecturer, maxStudents: 1 };
      }
    });

    // Xóa giảng viên không còn được chọn
    Object.keys(newState).forEach((email) => {
      if (!selectedEmails.includes(email)) delete newState[email];
    });

    selectedLecturersRef.current = newState;
    setSelectedLecturersView({ ...newState });
  }, [rowSelection, data_unassigned?.unassigned]);

  const updateMaxStudents = useCallback(
    (email: string, maxStudents: number) => {
      const ref = selectedLecturersRef.current;
      if (!ref[email]) return;
      ref[email].maxStudents = maxStudents;
      setSelectedLecturersView({ ...ref });
    },
    []
  );

  const removeLecturer = useCallback((email: string) => {
    const ref = selectedLecturersRef.current;
    delete ref[email];
    setSelectedLecturersView({ ...ref });
    setRowSelection((prev) => {
      if (!prev[email]) return prev;
      const next = { ...prev };
      delete next[email];
      return next;
    });
  }, []);

  // ====================== HANDLE CREATE ======================

  const handleCreateTrainingAdvisor = useCallback(() => {
    if (mutationCreateTrainingAdvisor.isPending) return;
    const selectedList = Object.values(selectedLecturersRef.current);
    if (selectedList.length === 0) {
      toast.error("Vui lòng chọn ít nhất một giảng viên");
      return;
    }

    const data = selectedList.map(({ lecturer, maxStudents }) => ({
      lecturerEmail: lecturer.email,
      faculty: lecturer.faculty!,
      maxStudents,
      schoolYear,
      semester,
      cohort,
      studentSelectDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }));

    mutationCreateTrainingAdvisor.mutate(data);
  }, [faculty]);

  // ====================== PAGINATION ======================

  const getPageNumbersUnassigned = useCallback(() => {
    const pages: (number | string)[] = [];
    const delta = 2;
    const total = data_unassigned?.totalPageUnassigned || 0;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    pages.push(1);
    if (pageUnassigned - delta > 2) pages.push("...");
    for (
      let i = Math.max(2, pageUnassigned - delta);
      i <= Math.min(total - 1, pageUnassigned + delta);
      i++
    )
      pages.push(i);
    if (pageUnassigned + delta < total - 1) pages.push("...");
    pages.push(total);
    return pages;
  }, [pageUnassigned, data_unassigned?.totalPageUnassigned]);

  const getPageNumbersAssigned = useCallback(() => {
    const pages: (number | string)[] = [];
    const delta = 2;
    const total = data_assigned?.totalPageAssigned || 0;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    pages.push(1);
    if (pageAssigned - delta > 2) pages.push("...");
    for (
      let i = Math.max(2, pageAssigned - delta);
      i <= Math.min(total - 1, pageAssigned + delta);
      i++
    )
      pages.push(i);
    if (pageAssigned + delta < total - 1) pages.push("...");
    pages.push(total);
    return pages;
  }, [pageAssigned, data_assigned?.totalPageAssigned]);

  const pagesUnassigned = getPageNumbersUnassigned();
  const pagesAssigned = getPageNumbersAssigned();
  const selectedLecturersCount = Object.keys(selectedLecturersView).length;
  const [isOpenSheet, setOpenSheet] = useState(false);
  const handleOpenChangeDialog = (open: boolean) => {
    if (mutationCreateTrainingAdvisor.isPending) return;
    setOpenSheet(open);
  };

  React.useEffect(() => {
    setPageUnassigned(1);
    setPageAssigned(1);
  }, [faculty]);

  // ====================== RENDER ======================

  return (
    <Sheet open={isOpenSheet} onOpenChange={handleOpenChangeDialog}>
      <SheetTrigger asChild>
        <Button size="sm">GVHD</Button>
      </SheetTrigger>
      <SheetContent
        className="sm:w-full lg:w-1/2 flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}>
        <SheetHeader>
          <SheetTitle>Phân công giảng viên hướng dẫn</SheetTitle>
          <SheetDescription>
            Đảm bảo giảng viên hướng dẫn không trùng nhau trong cùng năm học,
            học kỳ, khóa và ngành.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-6 flex-wrap mb-1">
            <div className="flex flex-col gap-2">
              <Label>Năm học</Label>
              <Input readOnly value={schoolYear} disabled />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Học kỳ</Label>
              <Input readOnly value={semester} disabled />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Khóa</Label>
              <Input readOnly value={cohort} disabled />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Khoa</Label>
            <Input readOnly value={faculty} disabled />
          </div>

          {faculty && (
            <div className="flex w-full flex-col gap-6">
              <Tabs defaultValue="unassigned">
                <TabsList className="justify-between w-full">
                  <div className="flex items-center gap-2">
                    <TabsTrigger value="unassigned">Chưa phân công</TabsTrigger>
                    <TabsTrigger value="assigned">Đã phân công</TabsTrigger>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refetch_unassigned();
                      refetch_assigned();
                    }}>
                    <RefreshCw
                      className={`${
                        (isFetching_unassigned || isFetching_assigned) &&
                        "animate-spin"
                      }`}
                    />
                  </Button>
                </TabsList>
                <TabsContent value="unassigned" className="w-full">
                  <Card>
                    <CardHeader className="pt-3">
                      <CardTitle>Chưa phân công</CardTitle>
                      <CardDescription>
                        Danh sách giảng viên chưa phân công hiện tại là{" "}
                        {data_unassigned?.totalUnassigned || 0}.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {status_unassigned === "pending" ||
                      isFetching_unassigned ? (
                        <div className="h-fit mx-auto w-fit py-20 flex items-center gap-2">
                          <Spinner />
                          <p className="text-zinc-500">Đang tải...</p>
                        </div>
                      ) : data_unassigned?.unassigned &&
                        data_unassigned?.unassigned?.length > 0 ? (
                        <div className="flex flex-col min-h-[10px]">
                          <div className="flex-1 overflow-y-auto border rounded-md">
                            <Table className="w-full">
                              <TableHeader>
                                {tableUnassigned.getHeaderGroups().map((hg) => (
                                  <TableRow key={hg.id}>
                                    {hg.headers.map((header) => (
                                      <TableHead key={header.id}>
                                        {header.isPlaceholder
                                          ? null
                                          : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                            )}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableHeader>

                              <TableBody>
                                {tableUnassigned.getRowModel().rows.length ? (
                                  tableUnassigned
                                    .getRowModel()
                                    .rows.map((row) => (
                                      <TableRow
                                        key={row.id}
                                        data-state={
                                          row.getIsSelected() && "selected"
                                        }>
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
                                    <TableCell
                                      colSpan={columnsUnassigned.length}
                                      className="text-center">
                                      Không có kết quả.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>

                          <div className="flex flex-wrap items-center justify-end space-x-2 py-4 flex-shrink-0">
                            <div className="flex-1 text-sm text-muted-foreground">
                              {selectedLecturersCount} giảng viên đã chọn
                            </div>
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <Button
                                    size="sm"
                                    disabled={pageUnassigned <= 1}
                                    variant="outline"
                                    onClick={() =>
                                      setPageUnassigned(pageUnassigned - 1)
                                    }>
                                    <ChevronLeftIcon /> Previous
                                  </Button>
                                </PaginationItem>
                                {pagesUnassigned.map((p, i) =>
                                  p === "..." ? (
                                    <PaginationItem key={i}>
                                      <PaginationEllipsis />
                                    </PaginationItem>
                                  ) : (
                                    <PaginationItem key={i}>
                                      <PaginationLink
                                        isActive={p === pageUnassigned}
                                        onClick={() =>
                                          setPageUnassigned(p as number)
                                        }>
                                        {p}
                                      </PaginationLink>
                                    </PaginationItem>
                                  )
                                )}
                                <PaginationItem>
                                  <Button
                                    size="sm"
                                    disabled={
                                      pageUnassigned >=
                                      data_unassigned?.totalPageUnassigned
                                    }
                                    variant="outline"
                                    onClick={() =>
                                      setPageUnassigned(pageUnassigned + 1)
                                    }>
                                    Next <ChevronRightIcon />
                                  </Button>
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        </div>
                      ) : (
                        <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center gap-6">
                          <p className="text-3xl">{"(>_<)"}</p>
                          <p>Không có giảng viên nào.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assigned">
                  <Card>
                    <CardHeader className="pt-3">
                      <CardTitle>Đã phân công</CardTitle>
                      <CardDescription>
                        Danh sách giảng viên đã phân công hiện tại là{" "}
                        {data_assigned?.totalAssigned || 0}.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                      {status_assigned === "pending" || isFetching_assigned ? (
                        <div className="h-fit mx-auto w-fit py-20 flex items-center gap-2">
                          <Spinner />
                          <p className="text-zinc-500">Đang tải...</p>
                        </div>
                      ) : data_assigned?.assigned &&
                        data_assigned?.assigned?.length > 0 ? (
                        <div className="flex flex-col min-h-[10px]">
                          <div className="flex-1 overflow-y-auto border rounded-md">
                            <Table className="w-full">
                              <TableHeader>
                                {tableAssigned.getHeaderGroups().map((hg) => (
                                  <TableRow key={hg.id}>
                                    {hg.headers.map((header) => (
                                      <TableHead key={header.id}>
                                        {header.isPlaceholder
                                          ? null
                                          : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                            )}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                ))}
                              </TableHeader>

                              <TableBody>
                                {tableAssigned.getRowModel().rows.length ? (
                                  tableAssigned
                                    .getRowModel()
                                    .rows.map((row) => (
                                      <TableRow
                                        key={row.id}
                                        data-state={
                                          row.getIsSelected() && "selected"
                                        }>
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
                                    <TableCell
                                      colSpan={columnsAssigned.length}
                                      className="text-center">
                                      Không có kết quả.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>

                          <div className="flex flex-wrap items-center justify-end space-x-2 py-4 flex-shrink-0">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <Button
                                    size="sm"
                                    disabled={pageAssigned <= 1}
                                    variant="outline"
                                    onClick={() =>
                                      setPageAssigned(pageAssigned - 1)
                                    }>
                                    <ChevronLeftIcon /> Previous
                                  </Button>
                                </PaginationItem>
                                {pagesAssigned.map((p, i) =>
                                  p === "..." ? (
                                    <PaginationItem key={i}>
                                      <PaginationEllipsis />
                                    </PaginationItem>
                                  ) : (
                                    <PaginationItem key={i}>
                                      <PaginationLink
                                        isActive={p === pageAssigned}
                                        onClick={() =>
                                          setPageAssigned(p as number)
                                        }>
                                        {p}
                                      </PaginationLink>
                                    </PaginationItem>
                                  )
                                )}
                                <PaginationItem>
                                  <Button
                                    size="sm"
                                    disabled={
                                      pageAssigned >=
                                      data_assigned?.totalPageAssigned
                                    }
                                    variant="outline"
                                    onClick={() =>
                                      setPageAssigned(pageAssigned + 1)
                                    }>
                                    Next <ChevronRightIcon />
                                  </Button>
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        </div>
                      ) : (
                        <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center gap-6">
                          <p className="text-3xl">{"(>_<)"}</p>
                          <p>Không có giảng viên nào.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {selectedLecturersCount > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Giảng viên đã chọn</h3>
              <div className="space-y-3">
                {Object.entries(selectedLecturersView).map(([email, data]) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium capitalize">
                        {data.lecturer.name}
                      </p>
                      <p className="text-sm text-gray-600">{email}</p>
                      <p className="text-sm text-gray-500">
                        {data.lecturer.faculty}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Số SV tối đa:</Label>
                        <Input
                          type="number"
                          min="1"
                          value={data.maxStudents}
                          onChange={(e) =>
                            updateMaxStudents(
                              email,
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-20 h-8"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLecturer(email)}
                        className="text-red-500 border-red-300 hover:bg-red-50">
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="mt-6 flex justify-between gap-3">
          <SheetClose asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={mutationCreateTrainingAdvisor.isPending}>
              Hủy <Kbd>Esc</Kbd>
            </Button>
          </SheetClose>
          {mutationCreateTrainingAdvisor.isPending ? (
            <Button variant="outline" disabled size="sm">
              <Spinner />
              Đang phân công...
            </Button>
          ) : (
            <Button
              onClick={handleCreateTrainingAdvisor}
              size="sm"
              disabled={
                selectedLecturersCount === 0 ||
                mutationCreateTrainingAdvisor.isPending
              }>
              Phân công
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default React.memo(SheetCreateGVHD);
