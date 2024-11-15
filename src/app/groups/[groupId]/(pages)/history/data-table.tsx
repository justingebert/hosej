"use client";

import {
  ColumnDef,
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
import { ClipLoader } from "react-spinners"; // Import the ClipLoader component
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  hasMore,
  loading,
  onLoadMore,
}: DataTableProps<TData, TValue>) {

  const [columnVisibility, setColumnVisibility] = useState({
    question: true,
    answers: true, 
    questionType: false,
    submittedBy: false,
  });
  

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  return (
    
    <div className="rounded-md">
      <DataTableToolbar table={table} />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            !loading && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )
          )}
          {loading &&
          [...Array(10)].map((_, i) => (
            <TableRow key={i}>
              <TableCell colSpan={3} className="p-2">
                <Skeleton className="h-10" />
              </TableCell>
          </TableRow>
          ))
        }
        </TableBody>
      </Table>
      {hasMore && !loading && (
        <div className="flex justify-center mt-4 mb-6">
          <Button onClick={onLoadMore}>Load More</Button>
        </div>
      )}
    </div>
  );
}
