"use client";

import type { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { useParams } from "next/navigation";
import { useGroup } from "@/hooks/data/useGroup";
import { QuestionType } from "@/types/models/question";

interface DataTableToolbarProps<TData> {
    table: Table<TData>;
    search: string;
    onSearchChange: (value: string) => void;
}

const questionTypeLabels: Record<string, string> = {
    users: "Members",
    custom: "Custom",
    image: "Image",
    text: "Text",
    rating: "Rating",
    pairing: "Pairing",
};

const questionTypesOptions = Object.values(QuestionType).map((type) => ({
    label: questionTypeLabels[type] || type,
    value: type,
}));

export function DataTableToolbar<TData>({
    table,
    search,
    onSearchChange,
}: DataTableToolbarProps<TData>) {
    const params = useParams<{ groupId: string }>();
    const groupId = params ? params.groupId : "";
    const { group } = useGroup(groupId || null);

    const groupMembers = group?.members
        ? group.members.map((member) => ({
              label: member.name,
              value: String(member.user),
          }))
        : [];

    const isFiltered = table.getState().columnFilters.length > 0 || search.length > 0;

    return (
        <div className="space-y-2 mb-4">
            <div className="relative w-full">
                <Input
                    placeholder="Search questions..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredRowModel().rows.length} Results
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={!isFiltered}
                    onClick={() => {
                        table.resetColumnFilters();
                        onSearchChange("");
                    }}
                    className="h-8 px-2 lg:px-3"
                >
                    Reset
                    <X className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
