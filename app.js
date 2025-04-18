import { join, dirname } from 'path';
import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';

import express from 'express';

import 'dotenv/config';

import { connectDB } from './src/config/db.config.js';
import { errorHandler, HttpError } from './src/helpers/error-handler.helper.js';
import { validateObjectId } from './src/middlewares/validate-objectId.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure static files folder using environment variables
const uploadsPath = process.env.UPLOADS_PATH || '/toys-images';
const uploadsDir = process.env.UPLOADS_DIR || './uploads/toys';

// Configure the route to serve static files
app.use( uploadsPath, express.static( join( __dirname, uploadsDir.startsWith( './' ) ? uploadsDir.substring( 2 ) : uploadsDir ) ) );

const routesPath = join(__dirname, './src/routes');
const routeFiles = await readdir(routesPath);

async function loadRoutes() {
  for (const file of routeFiles) {
    const routeModule = await import(`./src/routes/${file}`);
    const router = routeModule.default;

    router.param('id', validateObjectId);

    app.use('/api/v1.0', router);
  }
}

await connectDB();

await loadRoutes();

app.use((req, res, next) => {
  const error = new HttpError('Not found', 404);
  next(error);
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
