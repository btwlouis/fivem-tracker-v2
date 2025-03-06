import { prisma } from "@/lib/prisma";

export async function GET() {
    const languages = await prisma.server.findMany({
        distinct: ['localeCountry'],
        select: {
            localeCountry: true,
        },
    });

    const formattedLanguages = languages.map((lang) => lang.localeCountry.toUpperCase());

    return Response.json(formattedLanguages);
}
