"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { QuestionType } from "@/types/Question"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

const questionTypesOptions = Object.values(QuestionType).map((type) => ({
  label: type,
  value: type,
}));


export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="grid grid-cols-2 grid-rows-3  gap-y-2">
      <div className="col-span-2">
        {/* Filter by Question */}
        <Input
          placeholder="Filter by question..."
          value={(table.getColumn("question")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("question")?.setFilterValue(event.target.value)}
          className=""
        />
      </div>
      <div className="col-span-2">
        {/* Filter by Question Type */}
        {table.getColumn("questionType") && (
          <DataTableFacetedFilter
            column={table.getColumn("questionType")}
            title="Question Type"
            options={questionTypesOptions}
          />
        )}

        {/* Filter by Submitted By */}
        {/* {table.getColumn("submittedBy") && (
          <DataTableFacetedFilter
            column={table.getColumn("submittedBy")}
            title="Submitted By"
            options={[]}
          />
        )} */}
        
      </div>
      <div>
      {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Reset
            <X />
          </Button>
        )}
      </div>
    </div>
  )
}
