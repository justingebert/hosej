"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
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
import { DataTableToolbar } from "./data-table-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/ui/custom/SkeletonList";
import { useRouter } from "next/navigation";
import type { IQuestion } from "@/types/models/question";

interface DataTableProps {
    columns: ColumnDef<IQuestion, unknown>[];
    data: IQuestion[];
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => void;
    search: string;
    onSearchChange: (value: string) => void;
}

export function DataTable({
    columns,
    data,
    hasMore,
    loading,
    onLoadMore,
    search,
    onSearchChange,
}: DataTableProps) {
    const router = useRouter();

    const table = useReactTable({
        data,
        columns,
        initialState: {
            columnVisibility: {
                question: true,
                questionType: false,
                submittedBy: false,
            },
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <>
            <DataTableToolbar table={table} search={search} onSearchChange={onSearchChange} />
            <Table>
                <TableHeader className="sr-only">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
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
                    {table.getRowModel().rows.length
                        ? table.getRowModel().rows.map((row) => (
                              <TableRow
                                  key={row.id}
                                  className="cursor-pointer active:bg-muted/80"
                                  onClick={() => {
                                      const q = row.original;
                                      router.push(`/groups/${q.groupId}/question/${q._id}/results`);
                                  }}
                              >
                                  {row.getVisibleCells().map((cell) => (
                                      <TableCell key={cell.id} className="py-3">
                                          {flexRender(
                                              cell.column.columnDef.cell,
                                              cell.getContext()
                                          )}
                                      </TableCell>
                                  ))}
                              </TableRow>
                          ))
                        : !loading && (
                              <TableRow>
                                  <TableCell colSpan={columns.length} className="h-24 text-center">
                                      No results.
                                  </TableCell>
                              </TableRow>
                          )}
                    {loading && (
                        <SkeletonList count={10}>
                            {(i) => (
                                <TableRow key={i}>
                                    <TableCell className="p-2" colSpan={columns.length}>
                                        <Skeleton className="h-10" />
                                    </TableCell>
                                </TableRow>
                            )}
                        </SkeletonList>
                    )}
                </TableBody>
            </Table>
            {hasMore && !loading && (
                <div className="flex justify-center mt-4 mb-6">
                    <Button onClick={onLoadMore}>Load More</Button>
                </div>
            )}
        </>
    );
}
