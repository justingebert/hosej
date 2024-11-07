"use client"

import { IQuestion } from "@/db/models/Question"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export type PartialIQuestion = Partial<IQuestion>

export const columns: ColumnDef<PartialIQuestion>[] = [
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
        <Link href={`/groups/${groupId}/question/${questionId}/results`} className="flex justify-center">
            <ArrowRight/>
        </Link>
      );
    },
  },
  // {
  //   accessorKey: "submittedBy",
  //   header: "Submitted By",
  //   enableColumnFilter: true,
  // },
  {
    accessorKey: "questionType",
    enableColumnFilter: true,
    enableHiding: true,
  },
];
