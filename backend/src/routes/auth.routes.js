import express from "express";
import { auth, db, serverTimestamp } from "../config/firebaseAdmin.js";
import { sendPasswordResetEmail, signInWithEmailAndPassword, signUpWithEmailAndPassword } from "../services/firebaseAuthClient.js";

const router = express.Router();

const allowedRoles = new Set(["shopkeeper", "supplier"]);

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const signUpResult = await signUpWithEmailAndPassword(String(email).trim(), String(password));
    const uid = signUpResult.localId;

    await auth.updateUser(uid, { displayName: String(name).trim() });
    await auth.setCustomUserClaims(uid, { role });

    await db.collection("users").doc(uid).set({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return res.status(201).json({
      user: {
        id: uid,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        role,
      },
      token: signUpResult.idToken,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("EMAIL_EXISTS")) {
      return res.status(409).json({ message: "Email already registered" });
    }

    if (error instanceof Error && error.message.includes("CONFIGURATION_NOT_FOUND")) {
      return res.status(400).json({
        message: "Firebase Email/Password sign-in is not enabled for this project",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "Registration failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "email, password and role are required" });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const signInResult = await signInWithEmailAndPassword(String(email).trim(), String(password));
    const decoded = await auth.verifyIdToken(signInResult.idToken);

    const profileSnap = await db.collection("users").doc(decoded.uid).get();
    const profile = profileSnap.exists ? profileSnap.data() : null;

    const storedRole = profile?.role || decoded.role || decoded.claims?.role;

    if (storedRole !== role) {
      return res.status(403).json({ message: "Role mismatch" });
    }

    return res.json({
      user: {
        id: decoded.uid,
        name: profile?.name || decoded.name || "User",
        email: profile?.email || decoded.email,
        role: storedRole,
      },
      token: signInResult.idToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("INVALID_LOGIN_CREDENTIALS") || message.includes("EMAIL_NOT_FOUND") || message.includes("INVALID_PASSWORD")) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.status(500).json({ message: "Login failed", error: message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    await sendPasswordResetEmail(String(email).trim());
    return res.json({ message: "Password reset email sent" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("EMAIL_NOT_FOUND")) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    return res.status(500).json({ message: "Failed to send reset email", error: message });
  }
});

export default router;
