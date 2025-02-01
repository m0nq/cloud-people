import { join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import express from 'express';

import { browserRoutes } from './api/browser/browser.routes.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '../../..');
const envPath = join(rootDir, '.env');

console.log('Loading environment variables from:', envPath);

try {
    const envFile = readFileSync(envPath, 'utf-8');
    const envVars = envFile.split('\n').reduce((acc, line) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            acc[key.trim()] = valueParts.join('=').trim();
        }
        return acc;
    }, {} as Record<string, string>);

    console.log('Found environment variables:', Object.keys(envVars));

    // Set the ANTHROPIC_API_KEY specifically
    if (envVars.ANTHROPIC_API_KEY) {
        process.env.ANTHROPIC_API_KEY = envVars.ANTHROPIC_API_KEY;
        console.log('Successfully set ANTHROPIC_API_KEY');
    }
} catch (error) {
    console.error('Error loading .env file:', error);
}

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.get('/', (_req, res) => {
    res.json({ message: 'Cloud People API' });
});

app.use('/api/browser', browserRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
