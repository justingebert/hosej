"use client"

import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

// Sample colors for pie chart
const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))", "hsl(var(--chart-7))", "hsl(var(--chart-8))", "hsl(var(--chart-9))", "hsl(var(--chart-10))"];

// Chart for Questions by Type
export function QuestionsByType({data}: { data: any[] }) {


    const chartData = data.map((item, index) => ({
        name: item._id,
        value: item.count,
        fill: COLORS[index % COLORS.length],
    }));

    const questionsByTypeConfig: ChartConfig = {
        value: {
            label: "Questions Count",
        },
        ...chartData.reduce((config: any, item) => {
            config[item.name] = {
                label: item.name,
                color: item.fill,
            };
            return config;
        }, {}),
    };

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-xl">By Type</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={questionsByTypeConfig}
                    className="mx-auto aspect-square max-h-[300px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel/>}
                        />

                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={35}
                            width={400}
                            height={400}
                        />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="name"/>}
                            className="flex-wrap justify-center gap-2"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}


export function QuestionsByUser({data}: { data: any[] }) {
    // Step 1: Generate chart data for the Pie chart
    const chartData = data.map((item, index) => ({
        name: item.username,  // Use the actual name (user) from the data
        value: item.count,  // The count value for each user
        fill: COLORS[index % COLORS.length],  // Assign color based on index
    }));

    // Step 2: Create chart config dynamically
    const questionsByUserConfig: ChartConfig = {
        value: {
            label: "Questions Count",
        },
        ...chartData.reduce((config: any, item) => {
            config[item.name] = {
                label: item.name,  // Set label as the actual name (user) from the data
                color: item.fill,  // Use the fill color for the legend
            };
            return config;
        }, {}),
    };

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle className="text-xl">By User</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={questionsByUserConfig}
                    className="mx-auto aspect-square max-h-[300px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel/>}
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={35}
                            width={400}
                            height={400}
                        />
                        <ChartLegend
                            content={<ChartLegendContent nameKey="name"/>}
                            className="flex-wrap justify-center gap-2 "
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}