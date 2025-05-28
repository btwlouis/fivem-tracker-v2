import path from 'path';
import { promises as fsPromises } from 'fs';

const ICONS_DIR = path.join(process.cwd(), 'icons');

export class IconService {
    private static instance: IconService;
    private iconCache: Map<string, string> = new Map();

    private constructor() {
        this.ensureIconsDirectory();
    }

    public static getInstance(): IconService {
        if (!IconService.instance) {
            IconService.instance = new IconService();
        }
        return IconService.instance;
    }

    private async ensureIconsDirectory() {
        try {
            await fsPromises.access(ICONS_DIR);
        } catch {
            await fsPromises.mkdir(ICONS_DIR, { recursive: true });
        }
    }

    public async getIconPath(serverId: string, iconVersion: string | number | null): Promise<string> {
        const iconFileName = `${serverId}_${iconVersion || 'default'}.png`;
        const localPath = path.join(ICONS_DIR, iconFileName);
        const publicPath = `/api/icon/${iconFileName}`;
        const placeHolder = '/images/placeholder.jpeg'

        if (this.iconCache.has(serverId)) {
            return this.iconCache.get(serverId)!;
        }

        try {
            await fsPromises.access(localPath);
            this.iconCache.set(serverId, publicPath);
            return publicPath;
        } catch {
            try {
                const response = await fetch(
                    `https://servers-frontend.fivem.net/api/servers/icon/${serverId}/${iconVersion || 'default'}.png`
                );

                if (!response.ok) {
                    return placeHolder;
                }

                const buffer = await response.arrayBuffer();
                await fsPromises.writeFile(localPath, Buffer.from(buffer));
                
                this.iconCache.set(serverId, publicPath);
                return publicPath;
            } catch (error) {
                console.log(`Failed to download icon for server ${serverId}:`, error);
                return placeHolder;
            }
        }
    }

    public async preloadIcons(servers: Array<{ id: string; iconVersion: string | number | null }>) {
        const promises = servers.map(server => 
            this.getIconPath(server.id, server.iconVersion)
        );
        await Promise.all(promises);
    }
} 