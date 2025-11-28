import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GroupInfoCardProps {
    currentMemberName: string;
    groupId: string;
    createdAt: Date;
    adminName: string;
}

export function GroupInfoCard({currentMemberName, groupId, createdAt, adminName}: GroupInfoCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Group Information</CardTitle>
                <CardDescription>Overview and general settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-sm text-muted-foreground">Your Name in this group</div>
                    <div className="text-right">{currentMemberName}</div>

                    <div className="text-sm text-muted-foreground">Group ID</div>
                    <div className="text-right break-all">{groupId}</div>

                    <div className="text-sm text-muted-foreground">Created At</div>
                    <div className="text-right">{new Date(createdAt).toLocaleDateString()}</div>

                    <div className="text-sm text-muted-foreground">Admin</div>
                    <div className="text-right">{adminName}</div>
                </div>
            </CardContent>
        </Card>
    );
}
