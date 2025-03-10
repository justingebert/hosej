"use client";

import { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { QuestionType } from "@/types/models/Question";
import { useParams } from "next/navigation";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { IGroupJson } from "@/types/models/group";

interface DataTableToolbarProps<TData> {
    table: Table<TData>;
}

const questionTypesOptions = Object.values(QuestionType).map((type) => ({
    label: type,
    value: type,
}));

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
    const params = useParams<{ groupId: string }>();
    const groupId = params? params.groupId : "";
    const { data: users } = useSWR<IGroupJson["members"]>(`/api/groups/${groupId}/members`, fetcher);

    const groupMembers = users
        ? users.map((user: any) => ({
              label: user.name,
              value: user.user,
          }))
        : [];

    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <div className="space-y-2 mb-4">
            <div className="relative w-full">
                <Input
                    value={(table.getColumn("question")?.getFilterValue() as string) ?? ""}
                    onChange={(event) => table.getColumn("question")?.setFilterValue(event.target.value)}
                    className="w-full pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2" />
            </div>

            <div className="flex flex-wrap justify-between md:space-x-2">
                {table.getColumn("questionType") && (
                    <div className="w-full md:w-1/2 max-w-[49%]">
                        <DataTableFacetedFilter
                            column={table.getColumn("questionType")}
                            title="Question Type"
                            options={questionTypesOptions}
                        />
                    </div>
                )}

                {table.getColumn("submittedBy") && (
                    <div className="w-full md:w-1/2 max-w-[49%]">
                        <DataTableFacetedFilter
                            column={table.getColumn("submittedBy")}
                            title="Submitted By"
                            options={groupMembers ?? []}
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center">
                <Button size="sm" className="h-8">
                    <div className="text-sm">{table.getFilteredRowModel().rows.length} Results</div>
                </Button>
                <Button disabled={!isFiltered} onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
                    Reset
                    <X className="-mr-1" />
                </Button>
            </div>
        </div>
    );
}
