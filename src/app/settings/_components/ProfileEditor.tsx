"use client";

import type { Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useImageUploader } from "@/hooks/useImageUploader";
import { useUser } from "@/hooks/data/useUser";
import { Trash } from "lucide-react";

export function ProfileEditor({ user }: { user: Session["user"] }) {
    const { toast } = useToast();
    const { user: data, updateUser } = useUser();
    const { uploading, compressImages, handleImageUpload } = useImageUploader();

    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const [compressed] = await compressImages([file]);
            const result = await handleImageUpload("user", "avatar", user._id, user._id, [
                compressed,
            ]);
            if (!result || result.length === 0) throw new Error("Upload failed");
            await updateUser({ avatar: result[0].key });
            toast({ title: "Avatar updated" });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            toast({ title: "Avatar update failed", description: message, variant: "destructive" });
        } finally {
            e.target.value = "";
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            await updateUser({ avatar: null });
            toast({ title: "Avatar removed" });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            toast({ title: "Avatar removal failed", description: message, variant: "destructive" });
        }
    };

    const initial = (user.username || "?").slice(0, 1).toUpperCase();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    {data?.avatarUrl && <AvatarImage src={data.avatarUrl} alt={user.username} />}
                    <AvatarFallback className="text-xl">{initial}</AvatarFallback>
                </Avatar>
                <div className="flex flex-row gap-2">
                    <label className="inline-flex">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarFile}
                            disabled={uploading}
                        />
                        <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            disabled={uploading}
                            type="button"
                        >
                            <span>{uploading ? "Uploading..." : "Change avatar"}</span>
                        </Button>
                    </label>
                    {data?.avatar && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            disabled={uploading}
                        >
                            <Trash className="w-5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
