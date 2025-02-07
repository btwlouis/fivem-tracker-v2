import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const page = request.nextUrl.searchParams.get('page');
    const pageNumber = page ? parseInt(page, 10) : 1;

    const limit = 50;
    const offset = (pageNumber - 1) * limit;

    const servers = await prisma.servers.findMany(
        {
            take: limit,
            skip: offset,
            orderBy: {
                playersCurrent: 'desc',
            },
        },
    );

    return Response.json(servers);
}