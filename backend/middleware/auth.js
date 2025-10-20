const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    try {
        let token = req.cookies?.accessToken;
        if (!token) {
            token = req.headers.authorization?.split(' ')[1]; 
        }
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { userId, email, roleId, companyId, warehouseId }
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};


const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const userRole = req.user.roleId || req.user.role;
        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
        if (!rolesArray.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    requireRole,
    JWT_SECRET
};
