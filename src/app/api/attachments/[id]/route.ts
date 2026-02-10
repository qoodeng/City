import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

export const GET = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params;

        const attachment = await db.query.attachments.findFirst({
            where: eq(attachments.id, id),
        });

        if (!attachment) {
            return new NextResponse("Not Found", { status: 404 });
        }

        try {
            const fileBuffer = await fs.readFile(attachment.filepath);

            return new NextResponse(fileBuffer, {
                headers: {
                    "Content-Type": attachment.mimeType,
                    "Content-Disposition": `inline; filename="${attachment.filename}"`,
                },
            });
        } catch (err) {
            console.error("File read error:", err);
            return new NextResponse("File not found on disk", { status: 404 });
        }

    } catch (error) {
        console.error("Get attachment error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
};

export const DELETE = async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params;

        const attachment = await db.query.attachments.findFirst({
            where: eq(attachments.id, id),
        });

        if (!attachment) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Delete from DB
        await db.delete(attachments).where(eq(attachments.id, id));

        // Delete from Disk (best effort)
        try {
            await fs.unlink(attachment.filepath);
            // Optional: Remove directory if empty? Na, complexity.
        } catch (err) {
            console.warn("Failed to delete file from disk:", err);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
