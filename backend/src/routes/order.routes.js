import express from "express";
import { db, serverTimestamp } from "../config/firebaseAdmin.js";
import { requireAuth } from "../middlewares/auth.js";

const router = express.Router();

const orderStatuses = new Set(["pending", "confirmed", "in_transit", "delivered", "cancelled"]);
const allowedQuantityUnits = new Set(["pcs", "kg", "g", "l", "ml"]);

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
    phoneNumber: String(data.phoneNumber || ""),
  };
}

async function findSupplierByName(name) {
  const normalized = normalizeText(name);
  if (!normalized) return null;

  const snapshot = await db.collection("users").where("role", "==", "supplier").get();
  const match = snapshot.docs.find((doc) => normalizeText(doc.data()?.name) === normalized);
  if (!match) return null;
  return {
    id: match.id,
    ...(match.data() || {}),
  };
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

// Get all orders for the authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.uid);
    if (!profile) {
      return res.status(403).json({ message: "User profile not found" });
    }

    const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
    let orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (profile.role === "shopkeeper") {
      // Shopkeepers see orders they created
      orders = orders.filter((order) => order.createdBy === req.user.uid);
    } else if (profile.role === "supplier") {
      // Suppliers see orders assigned to them
      const supplierName = String(profile.name || "").trim().toLowerCase();
      orders = orders.filter((order) => {
        const matchesById = order.supplierId === req.user.uid;
        const matchesByName = supplierName
          && String(order.supplierName || "").trim().toLowerCase() === supplierName;
        return matchesById || matchesByName;
      });
    } else {
      // Should not happen if roles are enforced properly
      return res.status(403).json({ message: "Unauthorized role" });
    }

    return res.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get orders:", error);
    return res.status(500).json({ message: "Failed to get orders", error: message });
  }
});

// Create a new order
router.post("/", requireAuth, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.uid);
    if (!profile) {
      return res.status(403).json({ message: "User profile not found" });
    }

    if (profile.role !== "shopkeeper") {
      return res.status(403).json({ message: "Only shopkeepers can create orders" });
    }

    const {
      supplierId,
      supplierName,
      productName,
      quantity,
      quantityUnit,
      storeLocation,
      requestedDeliveryDate,
      notes,
    } = req.body;

    const normalizedUnit = String(quantityUnit || "pcs").trim().toLowerCase();
    const normalizedSupplierName = String(supplierName || "").trim();

    if (!normalizedSupplierName || !productName || !storeLocation || !requestedDeliveryDate || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({
        message: "supplierName, productName, quantity, storeLocation and requestedDeliveryDate are required",
      });
    }

    if (!allowedQuantityUnits.has(normalizedUnit)) {
      return res.status(400).json({ message: "quantityUnit must be one of: pcs, kg, g, l, ml" });
    }

    const matchedSupplier = supplierId ? null : await findSupplierByName(normalizedSupplierName);
    const resolvedSupplierId = supplierId ? String(supplierId) : (matchedSupplier?.id || null);

    const newOrder = {
      supplierId: resolvedSupplierId,
      supplierName: normalizedSupplierName,
      productName: String(productName).trim(),
      quantity: Number(quantity),
      quantityUnit: normalizedUnit,
      storeLocation: String(storeLocation).trim(),
      requestedDeliveryDate: String(requestedDeliveryDate),
      notes: String(notes || "").trim(),
      status: "pending",
      createdBy: req.user.uid,
      createdByName: profile.name,
      createdByPhone: profile.phoneNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await db.collection("orders").add(newOrder);

    if (resolvedSupplierId) {
      await createNotification({
        recipientId: resolvedSupplierId,
        senderId: req.user.uid,
        senderName: profile.name,
        type: "order_created",
        title: "New order received",
        message: `${profile.name || "Shopkeeper"} created an order for ${newOrder.quantity} ${newOrder.quantityUnit} of ${newOrder.productName}.`,
        relatedEntityType: "order",
        relatedEntityId: docRef.id,
      });
    }

    return res.status(201).json({
      order: {
        id: docRef.id,
        ...newOrder,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create order:", error);
    return res.status(500).json({ message: "Failed to create order", error: message });
  }
});

// Update order status
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const profile = await getUserProfile(req.user.uid);
    if (!profile) {
      return res.status(403).json({ message: "User profile not found" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!orderStatuses.has(String(status))) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const ref = db.collection("orders").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = snap.data() || {};
    const supplierName = String(profile.name || "").trim().toLowerCase();
    const isSupplierForOrder = order.supplierId === req.user.uid
      || (supplierName && String(order.supplierName || "").trim().toLowerCase() === supplierName);
    const isCreator = order.createdBy === req.user.uid;

    const nextStatus = String(status);

    if (profile.role === "supplier") {
      if (!isSupplierForOrder) {
        return res.status(403).json({ message: "Not allowed to update this order" });
      }

      if (!["confirmed", "in_transit", "delivered", "cancelled"].includes(nextStatus)) {
        return res.status(400).json({ message: "Supplier can only set confirmed, in_transit, delivered or cancelled" });
      }
    } else if (profile.role === "shopkeeper") {
      if (!isCreator) {
        return res.status(403).json({ message: "Not allowed to update this order" });
      }

      if (nextStatus !== "cancelled") {
        return res.status(400).json({ message: "Shopkeeper can only cancel order" });
      }
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    await ref.update({
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    if (profile.role === "supplier" && order.createdBy) {
      await createNotification({
        recipientId: String(order.createdBy),
        senderId: req.user.uid,
        senderName: profile.name,
        type: "order_status",
        title: "Order status updated",
        message: `Your order for ${order.productName || "product"} is now ${nextStatus.replace("_", " ")}.`,
        relatedEntityType: "order",
        relatedEntityId: id,
      });
    }

    if (profile.role === "shopkeeper" && nextStatus === "cancelled" && order.supplierId) {
      await createNotification({
        recipientId: String(order.supplierId),
        senderId: req.user.uid,
        senderName: profile.name,
        type: "order_cancelled",
        title: "Order cancelled",
        message: `${profile.name || "Shopkeeper"} cancelled an order for ${order.productName || "product"}.`,
        relatedEntityType: "order",
        relatedEntityId: id,
      });
    }

    return res.json({
      order: {
        id,
        ...order,
        status: nextStatus,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update order status:", error);
    return res.status(500).json({ message: "Failed to update order status", error: message });
  }
});

export default router;
