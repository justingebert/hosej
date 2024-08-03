"use client";

import {
  RadialBar,
  RadialBarChart,
  PolarGrid,
  PolarRadiusAxis,
  Label,
} from "recharts";
import { ChartConfig, ChartContainer } from "./ui/chart";
import { Card, CardContent } from "./ui/card";

export function CompletionChart({ completion }:any) {
  // Ensure both "Completion" and "Remaining" are provided
  const chartData = [
    { name: "Completion", value: completion, fill: "hsl(var(--chart-4))" },
    { name: "Remaining", value: 100 - completion, fill: "transparent" }, // Transparent fill to not show "Remaining"
  ];

  const chartConfig = {
    completion: {
      label: "%",
    },
  } satisfies ChartConfig;

  return (
    <div>
      <Card className="flex justify-center w-24 h-24">
        <CardContent className="flex justify-center">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <RadialBarChart
              data={chartData}
              startAngle={90}
              endAngle={-270} // Ensures that the chart fills proportionally
              innerRadius={"70%"}
              outerRadius={"100%"}
              barSize={10}
            >
              <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="none"
                className="first:fill-muted last:fill-background"
              />
              <RadialBar
                dataKey="value"
                background
                //clockWise
                cornerRadius={10}
                isAnimationActive={false}
              />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-m font-bold"
                          >
                            {completion}%
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
