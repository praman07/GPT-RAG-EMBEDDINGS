import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Validates JWT from HTTP-only auth cookie or Authorization Bearer header and attaches user id to request.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = req.cookies[ env.COOKIE_NAME ] || bearerToken;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Please login.',
        });
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: 'Session expired. Please login again.',
        });
    }
};

export default protect;
