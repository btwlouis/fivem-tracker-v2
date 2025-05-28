import path from 'path';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { filename } = req.query;

    if (typeof filename !== 'string') {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(process.cwd(), 'icons', filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).end('Icon not found');
    }

    const file = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'image/png');
    res.send(file);
}
