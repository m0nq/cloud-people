import { Router } from 'express';

import { browserController } from './browser.controller.js';

const router = Router();

router.post('/navigate/google', browserController.navigateToGoogle);

export const browserRoutes = router;
