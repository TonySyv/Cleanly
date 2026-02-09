import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ACCESS_EXPIRY = parseInt(process.env.JWT_ACCESS_EXPIRY || '3600', 10);
const REFRESH_EXPIRY = parseInt(process.env.JWT_REFRESH_EXPIRY || '604800', 10);

/** @param {{ userId: string, role?: string }} payload */
export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
}

/** @param {{ userId: string, type?: string, role?: string }} payload */
export function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export const ACCESS_EXPIRY_SECONDS = ACCESS_EXPIRY;
