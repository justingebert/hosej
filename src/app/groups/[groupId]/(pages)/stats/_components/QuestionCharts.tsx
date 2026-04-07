"use client";

import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6))",
    "hsl(var(--chart-7))",
    "hsl(var(--chart-8))",
    "hsl(var(--chart-9))",
    "hsl(var(--chart-10))",
];

const questionTypeLabels: Record<string, string> = {
    users: "Members",
    custom: "Custom",
    image: "Image",
    text: "Text",
    rating: "Rating",
    pairing: "Pairing",
};

function buildChartConfig(items: { name: string; fill: string }[]): ChartConfig {
    const config: ChartConfig = { value: { label: "Count" } };
    for (const item of items) {
        config[item.name] = { label: item.name, color: item.fill };
    }
    return config;
}

export function QuestionsByType({ data }: { data: { _id: string; count: number }[] }) {
    const chartData = data.map((item, index) => ({
        name: questionTypeLabels[item._id] || item._id,
        value: item.count,
        fill: COLORS[index % COLORS.length],
    }));

    return (
        <Card>
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-base">By Type</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
                <ChartContainer
                    config={buildChartConfig(chartData)}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={35} />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="name" />}
                            className="flex-wrap justify-center gap-2"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export function QuestionsByUser({ data }: { data: { username: string; count: number }[] }) {
    const chartData = data.map((item, index) => ({
        name: item.username,
        value: item.count,
        fill: COLORS[index % COLORS.length],
    }));

    return (
        <Card>
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-base">By User</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
                <ChartContainer
                    config={buildChartConfig(chartData)}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={35} />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="name" />}
                            className="flex-wrap justify-center gap-2"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
