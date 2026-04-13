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

router.get("/", requireAuth, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.uid);
    if (!profile) {
      return res.status(403).json({ message: "User profile not found" });
    }

    const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();

    let products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (profile.role === "supplier") {
      products = products.filter((product) => canSupplierAccessProduct(profile, product, req.user.uid));
    }

    return res.json({ products });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, quantity, expiryDate, supplier } = req.body;

    if (!name || !expiryDate || !supplier || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({ message: "name, quantity, expiryDate and supplier are required" });
    }

    const payload = {
      name: String(name).trim(),
      quantity: Number(quantity),
      expiryDate: String(expiryDate),
      supplier: String(supplier).trim(),
      supplierNormalized: normalizeText(supplier),
      createdBy: req.user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await db.collection("products").add(payload);

    return res.status(201).json({
      product: {
        id: ref.id,
        ...payload,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, expiryDate, supplier } = req.body;

    if (!name || !expiryDate || !supplier || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({ message: "name, quantity, expiryDate and supplier are required" });
    }

    const profile = await getUserProfile(req.user.uid);
    if (!profile) {
      return res.status(403).json({ message: "User profile not found" });
    }

    const ref = db.collection("products").doc(id);
    const current = await ref.get();

    if (!current.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const currentData = current.data() || {};

    if (profile.role === "supplier" && !canSupplierAccessProduct(profile, currentData, req.user.uid)) {
      return res.status(403).json({ message: "Not allowed to update this product" });
    }

    const updates = {
      name: String(name).trim(),
      quantity: Number(quantity),
      expiryDate: String(expiryDate),
      supplier: String(supplier).trim(),
      supplierNormalized: normalizeText(supplier),
      updatedAt: serverTimestamp(),
    };

    await ref.update(updates);

    return res.json({
      product: {
        id,
        ...currentData,
        ...updates,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await getUserProfile(req.user.uid);

    if (!profile) {
      return res.status(403).json({ message: "User profile not found" });
    }

    const ref = db.collection("products").doc(id);
    const current = await ref.get();

    if (!current.exists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const currentData = current.data() || {};

    if (profile.role === "supplier" && !canSupplierAccessProduct(profile, currentData, req.user.uid)) {
      return res.status(403).json({ message: "Not allowed to delete this product" });
    }

    await ref.delete();
    return res.json({ message: "Product deleted", id });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
