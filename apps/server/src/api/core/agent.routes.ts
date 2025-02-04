import { Router } from 'express';

import { AgentController } from './agent.controller';

const router = Router();
const controller = new AgentController();

router.post('/execute', (req, res) => controller.executeTask(req, res));

export default router;
