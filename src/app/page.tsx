import Header from "@/components/Header";
import { columns } from "@/components/list/servers/columns";
import { DataTable } from "@/components/list/servers/data-table";
import { prisma } from "@/lib/prisma";

async function getServers(locale: string) {
    const limit = 100;

    try {
        const allServers = await prisma.server.findMany({
            take: limit,
            where: locale ? { localeCountry: locale } : {},
            orderBy: {
                playersCurrent: 'desc',
            },
        });

        const servers = allServers.map((server, index) => ({
            ...server,
            rank: index + 1,
        }));
 
        return servers;
    } catch (error) {
        console.error("Failed to fetch servers:", error);
        return [];
    }
}

async function getLanguages(): Promise<string[]> {
    const languages = await prisma.server.findMany({
        distinct: ['localeCountry'],
        select: {
            localeCountry: true,
        },
    });

    const formattedLanguages = languages.map((lang) => lang.localeCountry.toUpperCase());

    return formattedLanguages;
}

export default async function Home({
    searchParams,
  }: Readonly<{
    searchParams: Promise<{ locale: string }>;
  }>) {
    let { locale } = await searchParams;

    locale = locale || 'de';

    const servers = await getServers(locale);
    const languages: string[] = await getLanguages();

    return (
        <div className="container">
            <Header languages={languages} />

            <div>
                {servers.length === 0 ? (
                    <p className="text-white">No servers available.</p>
                ) : (
                    
                    <DataTable 
                        columns={columns}
                        data={servers}
                        />
                )}
            </div>
        </div>
    );
}
