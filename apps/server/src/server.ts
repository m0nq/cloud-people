import { join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import express from 'express';
import { createServer } from 'http';

import { AgentExecutionService } from '@agents/services/agent-execution.service';
import { AgentDefinitionRepository } from '@agents/infrastructure/agent-definition.repository';

import browserRoutes from '@api/browser/browser.routes';
import agentRoutes from '@api/core/agent.routes';

import { createClient } from '@supabase/supabase-js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '../../..');
const envPath = join(rootDir, '.env');

console.log('Loading environment variables from:', envPath);

try {
	const envFile = readFileSync(envPath, 'utf-8');
	const envVars = envFile.split('\n').reduce(
		(acc, line) => {
			const [key, ...valueParts] = line.split('=');
			if (key && valueParts.length > 0) {
				acc[key.trim()] = valueParts.join('=').trim();
			}
			return acc;
		},
		{} as Record<string, string>
	);

	console.log('Found environment variables:', Object.keys(envVars));

	// Set the ANTHROPIC_API_KEY specifically
	if (envVars.ANTHROPIC_API_KEY) {
		process.env.ANTHROPIC_API_KEY = envVars.ANTHROPIC_API_KEY;
		console.log('Successfully set ANTHROPIC_API_KEY');
	}
} catch (error) {
	console.error('Error loading .env file:', error);
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.get('/', (_req, res) => {
	res.json({ message: 'Cloud People API' });
});

// Agent routes
app.use('/api/agent', agentRoutes);
app.use('/api/browser', browserRoutes); // Keep for backward compatibility

// Initialize services
const agentDefinitionRepo = new AgentDefinitionRepository(supabase);
const agentExecutionService = new AgentExecutionService(httpServer, agentDefinitionRepo);

httpServer.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
