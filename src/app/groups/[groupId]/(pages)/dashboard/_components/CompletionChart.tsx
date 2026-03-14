"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

export function CompletionChart({ completion }: { completion: number }) {
    // Data configuration with completion value

    const getFillColor = () => {
        if (completion < 33) return "red";
        if (completion < 66) return "orange";
        return "green";
    };

    const data = [{ name: "Completion", value: completion, fill: getFillColor() }];

    const circleSize = 100;

    return (
        <div>
            <RadialBarChart
                width={circleSize}
                height={circleSize}
                cx={circleSize / 2}
                cy={circleSize / 2}
                innerRadius={35}
                outerRadius={50}
                barSize={10}
                data={data}
                startAngle={90}
                endAngle={-270}
            >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={circleSize / 2}
                    fill="hsl(var(--chart-4))"
                    isAnimationActive={true}
                />
                <text
                    x={circleSize / 2}
                    y={circleSize / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-m font-bold"
                >
                    {completion}%
                </text>
            </RadialBarChart>
        </div>
    );
}
