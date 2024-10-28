"use client"

import { IQuestion } from "@/db/models/Question"
import { ColumnDef } from "@tanstack/react-table"

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
      const question = row.original.question;

      return (
        <a href={`/groups/${groupId}/question/${questionId}/results`}>
          Results
        </a>
      );
    },
  },
];
