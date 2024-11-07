"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { questionTypes } from "./questionTypes"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="">
      <div className="w-full">
        {/* Filter by Question */}
        <Input
          placeholder="Filter by question..."
          value={(table.getColumn("question")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("question")?.setFilterValue(event.target.value)}
          className=""
        />
      </div>
      <div>
        {/* Filter by Submitted By */}
        {/* {table.getColumn("submittedBy") && (
          <DataTableFacetedFilter
            column={table.getColumn("submittedBy")}
            title="Submitted By"
            options={members}
          />
        )} */}

        {/* Filter by Question Type */}
        {/* {table.getColumn("questionType") && (
          <DataTableFacetedFilter
            column={table.getColumn("questionType")}
            title="Question Type"
            options={questionTypes}
          />
        )} */}

        {/* Reset Filters Button */}
        
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
