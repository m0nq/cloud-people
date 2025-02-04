import { Router } from 'express';

import { BrowserController } from './browser.controller';

const router = Router();
const controller = new BrowserController();

router.post('/execute', (req, res) => controller.executeTask(req, res));

export default router;
