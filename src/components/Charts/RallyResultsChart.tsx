"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
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
      <CardHeader>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer config={rallyVotesConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="username"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={110}
            />
            <XAxis dataKey="votes" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="votes" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  )
}
