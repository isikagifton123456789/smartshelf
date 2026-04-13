import { auth } from "../config/firebaseAdmin.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
