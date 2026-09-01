import 'dotenv/config.js';
import app from './src/app.js';
import connectToDb from './src/db/db.js';

const startServer = async () => {
  await connectToDb();

  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
};

startServer();