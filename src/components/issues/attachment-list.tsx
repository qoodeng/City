import { useState, useRef } from "react";
import { Attachment } from "@/lib/db/schema";
import { Paperclip, X, Download, FileIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AttachmentListProps {
    issueId: string;
    attachments?: Attachment[];
    onUpload?: () => void; // Callback to refresh
}

export function AttachmentList({ issueId, attachments = [], onUpload }: AttachmentListProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("issueId", issueId);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            toast.success("File uploaded");
            if (onUpload) onUpload();
        } catch (error) {
            toast.error("Failed to upload file");
            console.error(error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/attachments/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            toast.success("Attachment removed");
            if (onUpload) onUpload();
        } catch {
            toast.error("Failed to delete attachment");
        }
    };

    const downloadUrl = (id: string) => `/api/attachments/${id}`;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                        <span className="text-xl mr-1 leading-none">+</span>
                    )}
                    Add
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>

            {attachments.length === 0 && (
                <div className="text-xs text-muted-foreground/50 italic px-2">
                    No attachments
                </div>
            )}

            <div className="grid grid-cols-1 gap-2">
                {attachments.map((file) => (
                    <div
                        key={file.id}
                        className="group flex items-center gap-3 p-2 rounded-md bg-city-surface hover:bg-city-surface-hover transition-colors text-sm border border-border/50"
                    >
                        <div className="p-2 rounded bg-background/50 text-muted-foreground">
                            <FileIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <a
                                href={downloadUrl(file.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="block truncate font-medium hover:underline hover:text-city-yellow decoration-city-yellow/50 underline-offset-4"
                            >
                                {file.filename}
                            </a>
                            <div className="text-[10px] text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                                href={downloadUrl(file.id)}
                                download
                                className="p-1.5 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                            >
                                <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                                onClick={() => handleDelete(file.id)}
                                className="p-1.5 hover:bg-background rounded text-muted-foreground hover:text-destructive"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
