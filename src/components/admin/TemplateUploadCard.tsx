"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import {
    validateTemplates,
    formatValidationErrors,
    type ValidationError,
} from "@/lib/template-questions/validateTemplateQuestions";

interface UploadResult {
    success?: boolean;
    loaded?: number;
    skipped?: number;
    errors?: ValidationError[];
}

export default function TemplateUploadCard() {
    const { toast } = useToast();
    const [packId, setPackId] = useState("");
    const [templatesJson, setTemplatesJson] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

    const uploadTemplates = async () => {
        setUploadResult(null);

        if (!packId.trim()) {
            toast({
                title: "Error",
                description: "Pack ID is required",
                variant: "destructive",
            });
            return;
        }

        if (!templatesJson.trim()) {
            toast({
                title: "Error",
                description: "Templates JSON is required",
                variant: "destructive",
            });
            return;
        }

        let templates;
        try {
            templates = JSON.parse(templatesJson);
        } catch (error) {
            toast({
                title: "Invalid JSON",
                description: "Please enter valid JSON format",
                variant: "destructive",
            });
            return;
        }

        // Validate templates on frontend before sending
        const validationResult = validateTemplates(templates);
        if (!validationResult.valid) {
            toast({
                title: "Validation Error",
                description: formatValidationErrors(validationResult.errors),
                variant: "destructive",
            });
            setUploadResult({
                loaded: 0,
                skipped: Array.isArray(templates) ? templates.length : 0,
                errors: validationResult.errors,
            });
            return;
        }

        setUploading(true);
        try {
            const response = await fetch("/api/admin/question-templates/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    packId: packId.trim(),
                    templates,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to upload templates");
            }

            setUploadResult(result);

            if (result.loaded > 0) {
                toast({
                    title: "Templates Uploaded",
                    description: `Successfully uploaded ${result.loaded} template(s)`,
                });
            }

            if (result.errors && result.errors.length > 0) {
                toast({
                    title: "Some Errors Occurred",
                    description: `${result.skipped} template(s) skipped due to errors`,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error uploading templates:", error);
            toast({
                title: "Upload Failed",
                description: error instanceof Error ? error.message : "Failed to upload templates",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div>
                        <CardTitle>Upload Question Templates</CardTitle>
                        <CardDescription>
                            Paste JSON array of question templates to create a new pack
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="packId">Pack ID</Label>
                    <Input id="packId" value={packId} onChange={(e) => setPackId(e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="templates">Templates JSON</Label>
                    <Textarea
                        id="templates"
                        placeholder={`[\n  {\n    ...\n  }\n]`}
                        value={templatesJson}
                        onChange={(e) => setTemplatesJson(e.target.value)}
                        rows={12}
                        className="font-mono text-sm"
                    />
                </div>

                {uploadResult && (
                    <div className="space-y-2">
                        {uploadResult.loaded && uploadResult.loaded > 0 && (
                            <div className="flex items-start gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    Successfully uploaded {uploadResult.loaded} template(s)
                                </p>
                            </div>
                        )}
                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                            <div className="flex items-start gap-2 p-4 border rounded-lg bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                                <div className="flex-1 space-y-1 text-sm text-red-800 dark:text-red-200">
                                    <p className="font-semibold">
                                        {uploadResult.skipped} template(s) skipped:
                                    </p>
                                    <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                                        {uploadResult.errors.slice(0, 10).map((err, idx) => (
                                            <li key={idx}>
                                                Template {err.index}: {err.field} - {err.message}
                                            </li>
                                        ))}
                                        {uploadResult.errors.length > 10 && (
                                            <li>
                                                ... and {uploadResult.errors.length - 10} more
                                                errors
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <Button onClick={uploadTemplates} disabled={uploading} size="lg" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Templates"}
                </Button>
            </CardContent>
        </Card>
    );
}
