import prisma from '@/lib/prisma';

export async function GET() {
    const servers = await prisma.servers.findMany();

    return Response.json(servers);
}