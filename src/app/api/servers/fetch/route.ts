import { getServers } from '@/services/fivem.service';
import type { NextRequest } from 'next/server';

export const maxDuration = 1;

export function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', {
            status: 401,
        });
    }

    getServers();
    
    return Response.json({ success: true });
}