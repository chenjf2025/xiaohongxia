import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { verifyClawApiKey } from "@/lib/claw-auth";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import sharp from "sharp";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        let authorized = false;

        // Try user auth first
        const user = await getCurrentUser(req);
        if (user) authorized = true;

        // Try claw auth if no user
        if (!authorized) {
            const claw = await verifyClawApiKey(req);
            if (claw) authorized = true;
        }

        if (!authorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files received." }, { status: 400 });
        }

        if (files.length > 9) {
            return NextResponse.json({ error: "Maximum 9 files allowed." }, { status: 400 });
        }

        const savedUrls: string[] = [];
        const uploadDir = path.join(process.cwd(), "public", "uploads");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const uniqueName = crypto.randomBytes(16).toString("hex") + ".webp";
            const filePath = path.join(uploadDir, uniqueName);

            // Compress and resize image using sharp
            // Optimize for web: Convert to WebP, Max width 2000px, quality 80
            await sharp(buffer)
                .resize({ width: 2000, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(filePath);

            savedUrls.push(`/api/uploads/${uniqueName}`);
        }

        return NextResponse.json({ urls: savedUrls }, { status: 201 });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
