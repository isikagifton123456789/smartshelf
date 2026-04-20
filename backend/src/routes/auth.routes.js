import express from "express";
import { auth, db, serverTimestamp } from "../config/firebaseAdmin.js";
import { signInWithEmailAndPassword, signInWithGoogleIdToken, signUpWithEmailAndPassword } from "../services/firebaseAuthClient.js";
import { sendForgotPasswordEmail, sendVerificationEmail } from "../services/mailer.js";

const router = express.Router();

const allowedRoles = new Set(["shopkeeper", "supplier"]);
const actionContinueUrl = process.env.EMAIL_ACTION_CONTINUE_URL || "http://localhost:8080/login";

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber } = req.body;

    if (!name || !email || !password || !role || !phoneNumber) {
      return res.status(400).json({ message: "name, email, password, role and phoneNumber are required" });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!/^\+?[0-9]{7,15}$/.test(String(phoneNumber).trim())) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const signUpResult = await signUpWithEmailAndPassword(String(email).trim(), String(password));
    const uid = signUpResult.localId;

    await auth.updateUser(uid, { displayName: String(name).trim() });
    await auth.setCustomUserClaims(uid, { role });

    await db.collection("users").doc(uid).set({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      role,
      phoneNumber: String(phoneNumber).trim(),
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Fire-and-forget email verification.
    (async () => {
      try {
        const verifyLink = await auth.generateEmailVerificationLink(String(email).trim().toLowerCase(), {
          url: actionContinueUrl,
          handleCodeInApp: false,
        });

        await sendVerificationEmail({
          to: String(email).trim().toLowerCase(),
          name: String(name).trim(),
          verifyLink,
        });
        console.log(`Verification email dispatch initiated for ${String(email).trim().toLowerCase()}`);
      } catch (mailError) {
        console.error("Verification email send failed in background:", mailError);
      }
    })();

    return res.status(201).json({
      message: "Account creation successful. Check your email to activate your account.",
      requiresEmailVerification: true,
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
    const firebaseUser = await auth.getUser(decoded.uid);

    if (!firebaseUser.emailVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const profileSnap = await db.collection("users").doc(decoded.uid).get();
    const profile = profileSnap.exists ? profileSnap.data() : null;

    const storedRole = profile?.role || decoded.role || decoded.claims?.role;

    if (storedRole !== role) {
      return res.status(403).json({ message: "Role mismatch" });
    }

    await db.collection("users").doc(decoded.uid).set({
      emailVerified: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return res.json({
      user: {
        id: decoded.uid,
        name: profile?.name || decoded.name || "User",
        email: profile?.email || decoded.email,
        role: storedRole,
        phoneNumber: profile?.phoneNumber || "",
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

router.post("/google", async (req, res) => {
  try {
    const { idToken, role, phoneNumber } = req.body;

    if (!idToken || !role) {
      return res.status(400).json({ message: "idToken and role are required" });
    }

    if (!allowedRoles.has(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (phoneNumber && !/^\+?[0-9]{7,15}$/.test(String(phoneNumber).trim())) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const signInResult = await signInWithGoogleIdToken(String(idToken));
    const decoded = await auth.verifyIdToken(signInResult.idToken);
    const uid = decoded.uid;

    const profileRef = db.collection("users").doc(uid);
    const profileSnap = await profileRef.get();

    const fallbackName = String(decoded.name || signInResult.displayName || "User").trim();
    const fallbackEmail = String(decoded.email || signInResult.email || "").trim().toLowerCase();

    if (!profileSnap.exists) {
      await auth.setCustomUserClaims(uid, { role });

      await profileRef.set({
        name: fallbackName,
        email: fallbackEmail,
        role,
        phoneNumber: String(phoneNumber || "").trim(),
        emailVerified: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const profileData = (await profileRef.get()).data() || {};
    const storedRole = profileData.role || decoded.role || decoded.claims?.role;

    if (storedRole !== role) {
      return res.status(403).json({ message: "Role mismatch" });
    }

    await auth.setCustomUserClaims(uid, { role: storedRole });
    await profileRef.set({
      name: String(profileData.name || fallbackName),
      email: String(profileData.email || fallbackEmail),
      phoneNumber: String(profileData.phoneNumber || phoneNumber || "").trim(),
      emailVerified: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return res.json({
      user: {
        id: uid,
        name: String(profileData.name || fallbackName),
        email: String(profileData.email || fallbackEmail),
        role: storedRole,
        phoneNumber: String(profileData.phoneNumber || phoneNumber || ""),
      },
      token: signInResult.idToken,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Google authentication failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    await auth.getUserByEmail(normalizedEmail);

    const resetLink = await auth.generatePasswordResetLink(normalizedEmail, {
      url: actionContinueUrl,
      handleCodeInApp: false,
    });

    await sendForgotPasswordEmail({ to: normalizedEmail, resetLink });
    return res.json({ message: "Password reset email sent. Link expires in about 1 hour." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("EMAIL_NOT_FOUND") || message.includes("auth/user-not-found")) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    return res.status(500).json({ message: "Failed to send reset email", error: message });
  }
});

export default router;
