import Header from "@/components/Header";
import { columns } from "@/components/list/servers/columns";
import { DataTable } from "@/components/list/servers/data-table";
import { prisma } from "@/lib/prisma";
import { IconService } from "@/services/icon-service";

async function getServers(locale: string, page: number = 1, pageSize: number = 50) {
    'use cache';

    const perf = performance.now();

    try {
        const skip = (page - 1) * pageSize;
        
        const [servers, totalCount] = await Promise.all([
            prisma.server.findMany({
                where: {
                    localeCountry: locale,
                    playersCurrent: {
                        gt: 0,
                    },
                },
                orderBy: {
                    playersCurrent: 'desc',
                },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    projectName: true,
                    playersCurrent: true,
                    projectDescription: true,
                    playersMax: true,
                    localeCountry: true,
                    iconVersion: true,
                },
            }),
            prisma.server.count({
                where: {
                    localeCountry: locale,
                    playersCurrent: {
                        gt: 0,
                    },
                },
            })
        ]);

        // Icons vorladen
        const iconService = IconService.getInstance();
        await iconService.preloadIcons(servers);

        const serversWithRank = servers.map((server, index) => ({
            ...server,
            rank: skip + index + 1,
        }));
        
        console.log(`Fetched (${servers.length}) servers in ${performance.now() - perf}ms`);

        return {
            servers: serversWithRank,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize)
        };
    } catch (error) {
        console.error("Failed to fetch servers:", error);
        return {
            servers: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0
        };
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
    searchParams: Promise<{ locale: string; page?: string }>;
  }>) {
    let { locale, page } = await searchParams;
    const currentPage = page ? parseInt(page) : 1;
    locale = locale || 'de';

    const { servers, totalCount, totalPages } = await getServers(locale, currentPage);
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
                        totalCount={totalCount}
                        currentPage={currentPage}
                        totalPages={totalPages}
                    />
                )}
            </div>
        </div>
    );
}
