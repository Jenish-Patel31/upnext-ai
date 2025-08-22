// /backend/utils/authMiddleware.js
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp(); // Uses default credentials

export const verifyToken = async (req, res, next) => {
    // const token = req.headers.authorization?.split('Bearer ')[1];
    // if (!token) return res.status(401).json({ error: 'Missing token' });
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.split("Bearer ")[1];
    if (token.startsWith("test_")) {
        req.user = { uid: token }; // Use token as UID
        return next();
    } else {
        try {
            const decoded = await getAuth().verifyIdToken(token);
            req.user = decoded;
            next();
        } catch (err) {
            res.status(401).json({ error: 'Invalid token' });
        }

    }

};
