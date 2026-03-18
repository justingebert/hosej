import type { Session } from "next-auth";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function UserDataTable({ user }: { user: Session["user"] }) {
    const formattedDate = new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    });
    const deviceId = typeof window !== "undefined" ? localStorage.getItem("deviceId") : null;

    return (
        <Table>
            <TableBody>
                <TableRow>
                    <TableCell className="font-medium">User ID</TableCell>
                    <TableCell>{user._id}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="font-medium">Username</TableCell>
                    <TableCell>{user.username}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell className="font-medium">Joined</TableCell>
                    <TableCell>{formattedDate}</TableCell>
                </TableRow>
                {deviceId && (
                    <TableRow>
                        <TableCell className="font-medium">Device ID</TableCell>
                        <TableCell>{deviceId}</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
