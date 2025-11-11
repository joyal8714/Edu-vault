// backend/middleware/adminMiddleware.js

export const isAdmin = (req, res, next) => {
    console.log('--- 3. Running isAdmin middleware ---');
    
    if (!req.user) {
        console.error('User object not found from previous middleware. Cannot check admin status.');
        return res.status(500).json({ message: 'User data not available after authentication.' });
    }

    console.log('Checking role for user. Role is:', req.user.role);

    if (req.user.role === 'admin') {
        console.log('Access GRANTED. User is an admin. Passing to controller...');
        next();
    } else {
        console.error('Access DENIED. User role is not "admin".');
        res.status(403).json({ message: 'Admin access required.' });
    }
};