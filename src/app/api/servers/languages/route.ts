import prisma from '@/lib/prisma';

export async function GET() {
    const languages = await prisma.servers.findMany({
        distinct: ['localeCountry'],
        select: {
            localeCountry: true,
        },
    });

    const formattedLanguages = languages.map((lang) => lang.localeCountry);

    return Response.json(formattedLanguages);
}
