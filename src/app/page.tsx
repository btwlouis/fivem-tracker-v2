import Header from "@/components/Header";
import ServerListItem from "@/components/ServerListItem";
import prisma from "@/lib/prisma";

interface HomeProps {
    searchParams?: {
        locale?: string;
        page?: string;
    };
}

async function getServers(locale: string, page: number) {
    const limit = 100;
    const offset = (page - 1) * limit;

    try {
        const allServers = await prisma.servers.findMany({
            take: limit,
            skip: offset,
            where: locale ? { localeCountry: locale } : {},
            orderBy: {
                playersCurrent: 'desc',
            },
        });

        const servers = allServers.map((server, index) => ({
            ...server,
            rank: index + 1,
        }));

        const totalServers = await prisma.servers.count({
            where: locale ? { localeCountry: locale } : {},
        });

        return {
            servers,
            totalPages: Math.ceil(totalServers / limit),
            currentPage: page
        };
    } catch (error) {
        console.error("Failed to fetch servers:", error);
        return {
            servers: [],
            totalPages: 0,
            currentPage: page
        };
    }
}

export default async function Home({ searchParams }: HomeProps) {
    const locale = searchParams?.locale || 'en';
    const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;
    const { servers, totalPages, currentPage } = await getServers(locale, page);

    return (
        <div>
            <Header />
            <div className="p-4">
                {servers.length === 0 ? (
                    <p className="text-white">No servers available.</p>
                ) : (
                    servers.map((server) => (
                        <ServerListItem key={server.id} server={server} />
                    ))
                )}
            </div>
            <div className="flex justify-center mt-4">
                {currentPage > 1 && (
                    <a 
                        href={`?locale=${locale}&page=${currentPage - 1}`} 
                        className="px-4 py-2 bg-gray-700 text-white rounded mr-2"
                    >
                        Previous
                    </a>
                )}
                {currentPage < totalPages && (
                    <a 
                        href={`?locale=${locale}&page=${currentPage + 1}`} 
                        className="px-4 py-2 bg-gray-700 text-white rounded"
                    >
                        Next
                    </a>
                )}
            </div>
        </div>
    );
}
