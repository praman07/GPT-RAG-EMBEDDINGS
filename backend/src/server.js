import app from './app/app.js';
import env from './config/env.js';
import connectDB from './config/db.js';
import { startKeepAliveService } from './services/keepAlive.service.js';

const startServer = async () => {
    await connectDB();

    app.listen(env.PORT, () => {
        console.log(`Server running on http://localhost:${env.PORT}`);
        startKeepAliveService();
    });
};

startServer();
