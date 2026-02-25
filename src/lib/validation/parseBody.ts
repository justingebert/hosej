import type { NextRequest } from "next/server";
import type { ZodSchema } from "zod";

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
    const raw = await req.json();
    return schema.parse(raw);
}

export function parseQuery<T>(searchParams: URLSearchParams, schema: ZodSchema<T>): T {
    const obj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        obj[key] = value;
    });
    return schema.parse(obj);
}
