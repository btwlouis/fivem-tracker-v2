import Header from "@/components/Header";
import { columns } from "@/components/list/servers/columns";
import { DataTable } from "@/components/list/servers/data-table";
import { prisma } from "@/lib/prisma";

async function getServers(locale: string) {
    'use cache';

    const perf = performance.now();

    try {
        const allServers = await prisma.server.findMany({
            where: {
                localeCountry: locale,
                playersCurrent: {
                    gt: 0,
                },
            },
            orderBy: {
                playersCurrent: 'desc',
            },
        });

        const servers = allServers.map((server, index) => ({
            ...server,
            rank: index + 1,
        }));
        
        console.log("Fetched (" + servers.length + ") servers in", performance.now() - perf, "ms");

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
