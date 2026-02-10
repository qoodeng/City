import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs/promises";

export const POST = async (req: NextRequest) => {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const issueId = formData.get("issueId") as string;

        if (!file || !issueId) {
            return NextResponse.json(
                { error: "File and issueId are required" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const id = nanoid();
        const filename = file.name;
        const safeFilename = `${id}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

        // Determine storage path
        // For now, let's use a "uploads" folder in current working directory for Dev, 
        // and try to find a persistent path for Prod.
        // If we are in Electron, process.resourcesPath might be useful, or we can use a relative path if the app is portable.
        // Let's rely on a helper or env var.

        // Simplest for v1: Use `uploads` in project root (dev) or userData (prod).
        // But getting userData path in Next.js server-side (which is a separate node process in some builds) is tricky.
        // Let's assume we can write to a specific location.

        let uploadDir = path.join(process.cwd(), "uploads");

        // In production (start with node server.js), we want meaningful persistence.
        // Mac: ~/Library/Application Support/C.I.T.Y./attachments
        // Win: %APPDATA%/C.I.T.Y./attachments
        // Linux: ~/.config/C.I.T.Y./attachments

        if (process.env.NODE_ENV === "production") {
            const home = process.env.HOME || process.env.USERPROFILE;
            if (process.platform === "darwin") {
                uploadDir = path.join(home!, "Library", "Application Support", "C.I.T.Y.", "attachments");
            } else if (process.platform === "win32") {
                uploadDir = path.join(process.env.APPDATA!, "C.I.T.Y.", "attachments");
            } else {
                uploadDir = path.join(home!, ".config", "C.I.T.Y.", "attachments");
            }
        }

        const issueDir = path.join(uploadDir, issueId);
        await fs.mkdir(issueDir, { recursive: true });

        const filepath = path.join(issueDir, safeFilename);
        await fs.writeFile(filepath, buffer);

        // Save to DB
        const newAttachment = await db.insert(attachments).values({
            id,
            issueId,
            filename,
            filepath, // Store absolute path? Or relative? Absolute is easier for now.
            mimeType: file.type,
            size: file.size,
        }).returning();

        return NextResponse.json(newAttachment[0]);
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
};
