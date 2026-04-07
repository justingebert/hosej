"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";

import type { IQuestion } from "@/types/models/question";

export const columns: ColumnDef<IQuestion>[] = [
    {
        accessorKey: "question",
        header: "Question",
        cell: ({ row }) => (
            <div className="flex items-center justify-between gap-2">
                <span className="line-clamp-2">{row.getValue("question")}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
        ),
    },
    {
        accessorKey: "submittedBy",
        header: "Submitted By",
        enableColumnFilter: true,
        enableHiding: true,
        filterFn: (row, id, filterValues) => {
            const cellValue = row.getValue(id);
            return filterValues.includes(cellValue);
        },
    },
    {
        accessorKey: "questionType",
        enableColumnFilter: true,
        filterFn: (row, id, filterValues) => {
            const cellValue = row.getValue(id);
            return filterValues.includes(cellValue);
        },
        enableHiding: true,
    },
];
