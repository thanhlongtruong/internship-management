"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Major } from "@/utils/major";

import { useStatePopupInfoUser } from "@/store/use-state-popup-info-user";

import { useQuery } from "@tanstack/react-query";

import { GetPdtStudents } from "@/api-client/pdt";

import { TypesUser } from "@/store/use-user-store";

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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

import {
  ChevronDown,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListChecks,
  ListTodo,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

import { Spinner } from "@/components/ui/spinner";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";

function PageStudent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { setStore } = useStatePopupInfoUser();

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) || 1 : 1;

  const currentYear = new Date().getFullYear();

  const years = React.useMemo(() => {
    return Array.from(
      { length: currentYear - 1900 + 1 },
      (_, i) => `${1900 + i}`
    );
  }, [currentYear]);

  const allMajors = Major.map((m) => m.value);
  const allYears = years;

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    {
      id: "major",
      value: allMajors,
    },
    {
      id: "cohort",
      value: allYears,
    },
  ]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ email: false });

  const [rowSelection, setRowSelection] = React.useState({});

  const { data, status, refetch, isFetching } = useQuery({
    queryKey: ["pdt-students", page, columnFilters],
    queryFn: () => GetPdtStudents(page, columnFilters),
    staleTime: 1000 * 60 * 30, //Fresh
    gcTime: 1000 * 60 * 35, //xoa khoi cache khi inactive, >= staleTime
    refetchOnWindowFocus: true,
  });

  const students = React.useMemo(() => {
    return (data?.data?.students as TypesUser[]) || [];
  }, [data]);

  const getPageNumbers = React.useCallback(() => {
    const pages: (number | string)[] = [];
    const delta = 2;

    const total = data?.data?.total as number;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    pages.push(1);

    if (page - delta > 2) pages.push("...");

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(total - 1, page + delta);
      i++
    ) {
      pages.push(i);
    }

    if (page + delta < total - 1) pages.push("...");

    pages.push(total);

    return pages;
  }, [page, data]);

  const pages = getPageNumbers();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (data?.data.total as number)) return;
    const params = new URLSearchParams(searchParams.toString());

    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }

    router.replace(`?${params.toString()}`);
  };

  const memoizedColumns = React.useMemo(() => columns(setStore), [setStore]);

  const table = useReactTable({
    data: students,
    columns: memoizedColumns,
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

  const currentMajors =
    (table.getColumn("major")?.getFilterValue() as string[]) ?? [];

  const toggleMajor = (value: string) => {
    const column = table.getColumn("major");
    if (!column) return;
    const newValues = currentMajors.includes(value)
      ? currentMajors.filter((v) => v !== value)
      : [...currentMajors, value];
    column.setFilterValue(newValues);
  };

  const selectAllMajor = () =>
    table.getColumn("major")?.setFilterValue(allMajors);
  const clearAllMajor = () => table.getColumn("major")?.setFilterValue([]);

  const currentYears =
    (table.getColumn("cohort")?.getFilterValue() as string[]) ?? [];

  const toggleYear = (y: string) => {
    const column = table.getColumn("cohort");
    if (!column) return;
    const newValues = currentYears.includes(y)
      ? currentYears.filter((v) => v !== y)
      : [...currentYears, y];
    column.setFilterValue(newValues);
  };

  const selectAllYear = () =>
    table.getColumn("cohort")?.setFilterValue(allYears);
  const clearAllYear = () => table.getColumn("cohort")?.setFilterValue([]);

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex items-center justify-between">
        <p className="font-medium text-lg">Danh sách sinh viên</p>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Email..."
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("email")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Khóa <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit">
              <div className="sticky top-0 z-10 bg-background py-3 flex flex-col gap-2">
                <div className="flex gap-2 w-fit">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onSelect={(e) => e.preventDefault()}
                        onClick={selectAllYear}>
                        <ListChecks />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Chọn tất cả</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onSelect={(e) => e.preventDefault()}
                        onClick={clearAllYear}>
                        <ListTodo />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bỏ tất cả</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              {allYears.map((y) => (
                <DropdownMenuCheckboxItem
                  key={y}
                  className="capitalize"
                  checked={currentYears.includes(y)}
                  onCheckedChange={() => toggleYear(y)}
                  onSelect={(e) => e.preventDefault()}>
                  {y}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Ngành <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="sticky top-0 z-10 bg-background py-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onSelect={(e) => e.preventDefault()}
                  onClick={selectAllMajor}>
                  Chọn tất cả
                  <ListChecks />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onSelect={(e) => e.preventDefault()}
                  onClick={clearAllMajor}>
                  Bỏ chọn
                  <ListTodo />
                </Button>
              </div>
              {allMajors.map((m) => (
                <DropdownMenuCheckboxItem
                  key={m}
                  className="capitalize"
                  checked={currentMajors.includes(m)}
                  onCheckedChange={() => toggleMajor(m)}
                  onSelect={(e) => e.preventDefault()}>
                  {m}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Submit"
                className={`${isFetching && "select-none pointer-events-none"}`}
                disabled={isFetching}
                onClick={() => refetch()}>
                <RefreshCw className={`${isFetching && "animate-spin"}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reload</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {status === "pending" && (
        <div className="h-fit mx-auto w-fit py-20 flex items-center gap-2">
          <Spinner />
          <p className="text-zinc-500">Loading....</p>
        </div>
      )}
      {status === "success" &&
        (!(data?.data.students as TypesUser[]) ||
          (data?.data.students as TypesUser[]).length === 0) && (
          <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
            <p className="text-3xl">{"(>_<)"}</p>
            <p>Không có sinh viên nào.</p>
          </div>
        )}
      {(data?.data.students as TypesUser[]) &&
        (data?.data.students as TypesUser[]).length > 0 && (
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

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    size="sm"
                    disabled={page <= 1}
                    variant="outline"
                    onClick={() => handlePageChange(page - 1)}>
                    <ChevronLeftIcon />
                    Previous
                  </Button>
                </PaginationItem>

                {pages.map((p, i) =>
                  p === "..." ? (
                    <PaginationItem key={i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={i}>
                      <PaginationLink
                        className="cursor-pointer select-none"
                        isActive={p === page}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(p as number);
                        }}>
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <Button
                    size="sm"
                    disabled={page >= data?.data?.total}
                    variant="outline"
                    onClick={() => handlePageChange(page + 1)}>
                    Next
                    <ChevronRightIcon />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </>
        )}
    </div>
  );
}

export const columns = (
  setStore: (user: TypesUser) => void
): ColumnDef<TypesUser>[] => [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("email")}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Họ tên",
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
  },

  {
    accessorKey: "major",
    header: "Ngành",
    cell: ({ row }) => <div>{row.getValue("major")}</div>,
    filterFn: (row, columnId, filterValue) => {
      const selectedMajors = filterValue as string[];
      if (selectedMajors.length === 0) return true;
      return selectedMajors.includes(row.getValue(columnId));
    },
  },
  {
    accessorKey: "cohort",
    header: "Khóa",
    cell: ({ row }) => <div>{row.getValue("cohort")}</div>,
    filterFn: (row, columnId, filterValue) => {
      const selectedYears = filterValue as string[];
      if (selectedYears.length === 0) return true;
      return selectedYears.includes(row.getValue(columnId));
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const student = row.original;

      return (
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
            <DropdownMenuItem onClick={() => setStore(student as TypesUser)}>
              Thông tin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStore(student as TypesUser)}>
              Xóa khỏi PDT
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default React.memo(PageStudent);
