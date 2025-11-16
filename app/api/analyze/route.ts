import { Issue } from "@/app/lint/components/Editor";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
    const { text } = await request.json();

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

    const response = await  fetch(`${backendUrl}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        throw new Error('Failed to analyze text');
    }

    const issues: Issue[] = await response.json();
    return NextResponse.json(issues);
}