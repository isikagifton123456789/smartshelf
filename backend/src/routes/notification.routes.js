import express from "express";
import { db, serverTimestamp } from "../config/firebaseAdmin.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

async function getUserProfile(uid) {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  return {
    id: uid,
    name: String(data.name || ""),
    role: String(data.role || ""),
  };
}

function canSupplierAccessProduct(profile, product, uid) {
  const supplierName = normalizeText(profile?.name);
  const productSupplier = normalizeText(product?.supplierNormalized || product?.supplier);
  return product?.createdBy === uid || (!!supplierName && supplierName === productSupplier);
}

async function createNotification({
  recipientId,
  senderId,
  senderName,
  type,
  title,
  message,
  relatedEntityType = null,
  relatedEntityId = null,
}) {
  if (!recipientId || !type || !title || !message) return;

  await db.collection("notifications").add({
    recipientId: String(recipientId),
    senderId: senderId ? String(senderId) : null,
    senderName: senderName ? String(senderName) : null,
    type: String(type),
    title: String(title),
    message: String(message),
    relatedEntityType: relatedEntityType ? String(relatedEntityType) : null,
    relatedEntityId: relatedEntityId ? String(relatedEntityId) : null,
    isRead: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const snapshot = await db
      .collection("notifications")
      .where("recipientId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch notifications",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const ref = db.collection("notifications").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const data = snap.data() || {};
    if (data.recipientId !== req.user.uid) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await ref.update({ isRead: true, updatedAt: serverTimestamp() });
    return res.json({ message: "Notification marked as read", id });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to mark notification as read",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/product-action", requireAuth, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.uid);
    if (!profile) {
      return res.status(403).json({ message: "User profile not found" });
    }

    if (profile.role !== "supplier") {
      return res.status(403).json({ message: "Only suppliers can send this action" });
    }

    const { productId, action } = req.body;
    const normalizedAction = String(action || "").trim().toLowerCase();

    if (!productId || !["restock", "acknowledge"].includes(normalizedAction)) {
      return res.status(400).json({ message: "productId and valid action are required" });
    }

    const productRef = db.collection("products").doc(String(productId));
    const productSnap = await productRef.get();

    if (!productSnap.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = productSnap.data() || {};

    if (!canSupplierAccessProduct(profile, product, req.user.uid)) {
      return res.status(403).json({ message: "Not allowed for this product" });
    }

    const recipientId = String(product.createdBy || "");
    if (!recipientId) {
      return res.status(400).json({ message: "Product owner not found" });
    }

    const title = normalizedAction === "restock" ? "Restock update" : "Supplier acknowledgement";
    const message = normalizedAction === "restock"
      ? `${profile.name || "Supplier"} sent a restock update for ${product.name || "a product"}.`
      : `${profile.name || "Supplier"} acknowledged ${product.name || "a product"}.`;

    await createNotification({
      recipientId,
      senderId: req.user.uid,
      senderName: profile.name,
      type: "supplier_action",
      title,
      message,
      relatedEntityType: "product",
      relatedEntityId: String(productId),
    });

    return res.status(201).json({ message: "Notification sent" });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to send notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
