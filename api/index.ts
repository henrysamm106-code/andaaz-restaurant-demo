import 'dotenv/config';
import express from 'express';
import { registerCoreApiRoutes } from '../server/coreRoutes.ts';
import { registerManagementApiRoutes } from '../server/apiRoutes.ts';

const app = express();
app.use(express.json({ limit: '32kb' }));

registerCoreApiRoutes(app);
registerManagementApiRoutes(app);

export default app;
