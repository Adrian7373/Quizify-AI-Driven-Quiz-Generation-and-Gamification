import { NextResponse } from "next/server";
import { waitForDatabaseConnection } from "@/lib/prisma-connection";

export async function GET() {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        await waitForDatabaseConnection();

        return NextResponse.json(
            {
                ok: true,
                db: "connected",
            },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                db: "disconnected",
                code: typeof error === "object" && error !== null && "code" in error && typeof (error as { code?: unknown }).code === "string"
                    ? (error as { code?: string }).code
                    : "UNKNOWN",
            },
            { status: 503 },
        );
    }
}
