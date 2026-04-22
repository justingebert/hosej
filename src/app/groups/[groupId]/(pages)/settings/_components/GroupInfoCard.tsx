"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface GroupInfoCardProps {
    currentMemberName: string;
    groupId: string;
    createdAt: Date;
    adminName: string;
}

export function GroupInfoCard({
    currentMemberName,
    groupId,
    createdAt,
    adminName,
}: GroupInfoCardProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const copyGroupId = async () => {
        try {
            await navigator.clipboard.writeText(groupId);
            setCopied(true);
            toast({ title: "Group ID copied" });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy group ID:", err);
            toast({ title: "Failed to copy", variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Group Information</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
                <InfoRow label="Your name" value={currentMemberName} />
                <InfoRow label="Admin" value={adminName} />
                <InfoRow label="Created" value={new Date(createdAt).toLocaleDateString()} />
                <div className="flex items-center justify-between gap-3 py-3">
                    <span className="text-sm text-muted-foreground shrink-0">Group ID</span>
                    <div className="flex items-center gap-2 min-w-0">
                        <code className="text-xs font-mono truncate bg-muted px-2 py-1 rounded">
                            {groupId}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={copyGroupId}
                            aria-label="Copy group ID"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 py-3">
            <span className="text-sm text-muted-foreground shrink-0">{label}</span>
            <span className="text-sm text-right truncate">{value}</span>
        </div>
    );
}
