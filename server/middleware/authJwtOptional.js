import jwt from 'jsonwebtoken';

export default function authJwtOptional(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
        req.userId = null;
        return next();
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
        req.userId = payload.id;
    } catch (err) {
        req.userId = null;
    }
    next();
}
