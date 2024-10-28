import { PartialIQuestion, columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<PartialIQuestion[]> {
  // Fetch data from your API here.
  return [
    {
      id: "667ec00a173e2ea2af293043",
      _id: "667ec00a173e2ea2af293043",
      groupId: "66c9f1307cfaf063db4777e3",
      question: "test",
    },
    // ...
  ]
}

export default async function HistoryPage() {
  const data = await getData()

  return (
    <div className="">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
