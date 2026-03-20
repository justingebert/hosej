"use client";

import type { Session } from "next-auth";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function UserDataTable({ user }: { user: Session["user"] }) {
    const [copied, setCopied] = useState(false);
    const formattedDate = new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    });
    const deviceId = typeof window !== "undefined" ? localStorage.getItem("deviceId") : null;

    const handleCopyDeviceId = () => {
        if (!deviceId) return;
        navigator.clipboard.writeText(deviceId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <span className="truncate max-w-[140px]">{deviceId}</span>
                                <button
                                    onClick={handleCopyDeviceId}
                                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
