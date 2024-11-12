"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { QuestionType } from "@/types/Question"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

const questionTypesOptions = Object.values(QuestionType).map((type) => ({
  label: type,
  value: type,
}));

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const { groupId } = useParams<{ groupId: string }>();
  const [groupMembers, setGroupMembers] = useState<[] | null>(null);

  useEffect(() => {
    const fetchSubmittedBy = async () => {
      const res = await fetch(`/api/groups/${groupId}/members`);
      const users = await res.json();
      const groupmembers = users.map((user: any) => ({
        label: user.name,
        value: user.user
      }));
      setGroupMembers(groupmembers);
    };

    fetchSubmittedBy();
  }, [groupId]);

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="space-y-2 mb-4">
      <div>
        <Input
          placeholder="Filter by question..."
          value={(table.getColumn("question")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("question")?.setFilterValue(event.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex justify-between space-x-2">
        {table.getColumn("questionType") && (
          <div className="w-1/2 max-w-[48%]">
            <DataTableFacetedFilter
              column={table.getColumn("questionType")}
              title="Question Type"
              options={questionTypesOptions}
            />
          </div>
        )}

        {table.getColumn("submittedBy") && (
          <div className="w-1/2 max-w-[48%]">
            <DataTableFacetedFilter
              column={table.getColumn("submittedBy")}
              title="Submitted By"
              options={groupMembers ?? []}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <Button size="sm" variant="outline">
          <div className="text-sm">{table.getFilteredRowModel().rows.length} Results</div>
        </Button>
        {isFiltered && (
          <Button variant="outline" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Reset
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}
