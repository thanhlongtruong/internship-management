"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

import { useQuery } from "@tanstack/react-query";
import { GetPdtLecturers } from "@/api-client/pdt";
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
import { TypesUser } from "@/store/use-user-store";
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

import { useStatePopupInfoUser } from "@/store/use-state-popup-info-user";
import { Faculty } from "@/utils/faculty";
import { Checkbox } from "@/components/ui/checkbox";

function PageLecturer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { setStore } = useStatePopupInfoUser();

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) || 1 : 1;

  const allFaculty = Faculty.map((m) => m.value);

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    {
      id: "faculty",
      value: allFaculty,
    },
  ]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ select: false });

  const { data, status, refetch, isFetching } = useQuery({
    queryKey: ["pdt-lecturers", page, columnFilters],
    queryFn: () => GetPdtLecturers(page, columnFilters),
    staleTime: 1000 * 60 * 30, //Fresh
    gcTime: 1000 * 60 * 35, //xoa khoi cache khi inactive, >= staleTime
    refetchOnWindowFocus: true,
  });

  const lecturers = React.useMemo(() => {
    return (data?.data?.lecturers as TypesUser[]) || [];
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

  const memoizedColumns = React.useMemo(
    () => columnsLecturer(setStore),
    [setStore]
  );

  const table = useReactTable({
    data: lecturers,
    columns: memoizedColumns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex: 0,
        pageSize: data?.data?.pageSize || 20,
      },
    },
  });

  const currentFaculty =
    (table.getColumn("faculty")?.getFilterValue() as string[]) ?? [];

  const toggleFaculty = (value: string) => {
    const column = table.getColumn("faculty");
    if (!column) return;
    const newValues = currentFaculty.includes(value)
      ? currentFaculty.filter((v) => v !== value)
      : [...currentFaculty, value];
    column.setFilterValue(newValues);
  };

  const selectAllFaculty = () =>
    table.getColumn("faculty")?.setFilterValue(allFaculty);
  const clearAllFaculty = () => table.getColumn("faculty")?.setFilterValue([]);

  return (
    <>
      <div className="flex flex-col gap-y-6">
        <div className="flex items-center justify-between">
          <p className="font-medium text-lg">Danh sách giảng viên</p>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Khoa <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="sticky top-0 z-10 bg-background py-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onSelect={(e) => e.preventDefault()}
                    onClick={selectAllFaculty}>
                    Chọn tất cả
                    <ListChecks />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onSelect={(e) => e.preventDefault()}
                    onClick={clearAllFaculty}>
                    Bỏ chọn
                    <ListTodo />
                  </Button>
                </div>
                {allFaculty.map((f) => (
                  <DropdownMenuCheckboxItem
                    key={f}
                    className="capitalize"
                    checked={currentFaculty.includes(f)}
                    onCheckedChange={() => toggleFaculty(f)}
                    onSelect={(e) => e.preventDefault()}>
                    {f}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  disabled={isFetching}
                  onClick={() => refetch()}>
                  <RefreshCw className={`${isFetching && "animate-spin"}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tải lại</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {status === "pending" && (
          <div className="h-fit mx-auto w-fit py-20 flex items-center gap-2">
            <Spinner />
            <p className="text-zinc-500">Đang tải....</p>
          </div>
        )}

        {status === "success" &&
          (!(data?.data.lecturers as TypesUser[]) ||
            (data?.data.lecturers as TypesUser[]).length === 0) && (
            <div className="h-fit mx-auto w-fit py-20 flex flex-col items-center justify-center gap-6">
              <p className="text-3xl">{"(>_<)"}</p>
              <p>Không có giảng viên nào.</p>
            </div>
          )}
        {(data?.data.lecturers as TypesUser[]) &&
          (data?.data.lecturers as TypesUser[]).length > 0 && (
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

              <div className="flex items-center justify-end space-x-2 py-4">
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
              </div>
            </>
          )}
      </div>
    </>
  );
}

export const columnsLecturer = (
  setStore: (user: TypesUser) => void
): ColumnDef<TypesUser>[] => [
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
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
  },

  {
    accessorKey: "faculty",
    header: "Khoa",
    cell: ({ row }) => <div>{row.getValue("faculty")}</div>,
    filterFn: (row, columnId, filterValue) => {
      const selectedFaculty = filterValue as string[];
      if (selectedFaculty.length === 0) return true;
      return selectedFaculty.includes(row.getValue(columnId));
    },
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
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-fit">
            <DropdownMenuLabel>Menu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStore(lecturer as TypesUser)}>
              Thông tin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default React.memo(PageLecturer);
