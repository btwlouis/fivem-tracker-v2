'use client';
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import ServerListItem from "@/components/ServerListItem";
import { IServerView } from "@/utils/types";

export default function Home() {
    const [servers, setServers] = useState<IServerView[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchServers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/servers`);
            const data = await res.json();
            setServers(data);
        } catch (error) {
            console.error("Failed to fetch servers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServers();
    }, []);

    return (
        <div>
            <Header />
            <div className="p-4">
                {loading ? (
                    <p className="text-white">Loading...</p>
                ) : (
                    servers.map((server) => (
                        <ServerListItem key={server.id} server={server} />
                    ))
                )}
            </div>
        </div>
    );
}
