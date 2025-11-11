// backend/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';

export const authenticateJWT = (req, res, next) => {
    console.log('--- 2. Running authenticateJWT middleware ---');
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (!token) {
            console.error('Authorization header format is incorrect. Token is missing.');
            return res.status(401).json({ message: 'Token not provided.' });
        }

        console.log('Token found. Verifying...');
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                console.error('JWT Verification FAILED:', err.message);
                return res.status(403).json({ message: 'Invalid token.' }); // Forbidden
            }
            console.log('JWT Verified Successfully.');
            req.user = user;
            next();
        });
    } else {
        console.error('Authorization header missing. Denying access.');
        res.status(401).json({ message: 'Authorization header required.' }); // Unauthorized
    }
};