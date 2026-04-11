"use client";

import TemplateUploadCard from "@/app/admin/_components/TemplateUploadCard";
import GroupPackManager from "@/app/admin/_components/GroupPackManager";
import Header from "@/components/ui/custom/Header";
import BackLink from "@/components/ui/custom/BackLink";

export default function AdminPage() {
    return (
        <>
            <Header title="Admin Panel" leftComponent={<BackLink href={`/settings`} />} />

            <div className="space-y-4">
                <GroupPackManager />

                <TemplateUploadCard />
            </div>
        </>
    );
}
