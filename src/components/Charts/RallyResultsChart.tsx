"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"


export function RallyVotesChart({ submissions }: { submissions: any[] }) {
  const chartData = submissions.map((submission, index) => ({
    username: submission.username, // Username for the label
    votes: submission.votes.length, // Number of votes for each submission
    fill: `hsl(var(--chart-${index % 5 + 1}))`, // Assign colors dynamically based on index
  }))

  // Step 2: Create chart config dynamically
  const rallyVotesConfig: ChartConfig = {
    votes: {
      label: "Votes",
    },
    ...chartData.reduce((config: any, item) => {
      config[item.username] = {
        label: item.username, // Set label as the username
        color: item.fill, // Use the fill color for the legend
      }
      return config
    }, {}),
  }

  return (
    <Card>
      <CardContent className="p-2"> 
        <ChartContainer config={rallyVotesConfig}>
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ right: 16 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="username"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value}
          hide
        />
        <XAxis dataKey="votes" type="number" hide />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar
          dataKey="votes"
          layout="vertical"
          fill="var(--color-desktop)"
          radius={4}
        >
          <LabelList
            dataKey="username"
            position="insideLeft"
            offset={8}
            className="fill-[--color-label]"
            fontSize={12}
          />
          <LabelList
            dataKey="votes"
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={12}
            formatter={(value:any) => (value === 0 ? "" : value)}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
      </CardContent>
    </Card>
  )
}
