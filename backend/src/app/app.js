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
            if (!origin) return callback(null, true);
            const cleanOrigin = origin.replace(/\/$/, '');
            if (allowedOrigins.includes(cleanOrigin)) {
                return callback(null, cleanOrigin);
            }
            return callback(null, cleanOrigin);
        },
        credentials: true,
        maxAge: 86400,
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
