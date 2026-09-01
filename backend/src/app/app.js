import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import env from '../config/env.js';
import authRouter from '../routes/auth.routes.js';
import errorMiddleware from '../middleware/error.middleware.js';
import conversationRouter from '../routes/conversation.routes.js';


const app = express();

const clientUrlClean = (env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
const allowedOrigins = [clientUrlClean, `${clientUrlClean}/` ];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, server-to-server) or matching origin
            if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
                callback(null, true);
            } else {
                callback(null, true); // Fallback to accept exact origin dynamically if needed
            }
        },
        credentials: true,
    }),
);
app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy',
    });
});

app.use('/api/auth', authRouter);
app.use('/api/conversation', conversationRouter);

app.use(errorMiddleware);

export default app;
