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

export default async function Home({
    searchParams,
  }: Readonly<{
    searchParams: Promise<{ locale: string }>;
  }>) {
    let { locale } = await searchParams;

    locale = locale || 'de';

    const servers = await getServers(locale);

    return (
        <div>
            <Header />
            <div className="p-4">
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
