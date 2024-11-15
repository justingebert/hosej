import * as React from "react"
import { Column } from "@tanstack/react-table"
import { Check, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues = new Set(column?.getFilterValue() as string[])

  const toggleSelection = (value: string) => {
    if (selectedValues.has(value)) {
      selectedValues.delete(value)
    } else {
      selectedValues.add(value)
    }
    const filterValues = Array.from(selectedValues)
    column?.setFilterValue(filterValues.length ? filterValues : undefined)
  }

  return (
    <Popover>
    <PopoverTrigger asChild>
      <Button className="text-xs truncate w-full">
        {title}
        <Separator orientation="vertical" className="mx-2 h-4" />
        <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden text-xs">
          {selectedValues.size}
        </Badge>
        <div className="hidden space-x-1 lg:flex">
          {selectedValues.size > 2 ? (
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {selectedValues.size} selected
            </Badge>
          ) : (
            options
              .filter((option) => selectedValues.has(option.value))
              .map((option) => (
                <Badge key={option.value} variant="secondary" className="rounded-sm px-1 font-normal">
                  {option.label}
                </Badge>
              ))
          )}
        </div>
      </Button>
    </PopoverTrigger>

      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="flex flex-col space-y-1">
          {options.map((option) => {
            const isSelected = selectedValues.has(option.value)
            return (
              <label
                key={option.value}
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => toggleSelection(option.value)}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                {option.icon && <option.icon className="h-4 w-4 text-muted-foreground" />}
                <span>{option.label}</span>
              </label>
            )
          })}
          {selectedValues.size > 0 && (
            <div className="mt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => column?.setFilterValue(undefined)}
                className="w-full"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
