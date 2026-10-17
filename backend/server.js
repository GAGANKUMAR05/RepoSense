import 'dotenv/config.js';
import app from './src/app.js';
import connectToDb from './src/db/db.js';

const startServer = async () => {
  await connectToDb();

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`RepoSense is running at http://localhost:${port}`);
  });
};

startServer();
