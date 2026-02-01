"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { IQuestion } from "@/types/models/question";

export const columns: ColumnDef<IQuestion>[] = [
    {
        accessorKey: "question",
        header: "Question",
    },
    {
        accessorKey: "answers",
        header: "Results",
        cell: ({ row }) => {
            const groupId = row.original.groupId;
            const questionId = row.original._id;

            return (
                <Link
                    href={`/groups/${groupId}/question/${questionId}/results`}
                    className="flex justify-center"
                >
                    <ArrowRight />
                </Link>
            );
        },
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
