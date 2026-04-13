import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Product } from "@/lib/sampleData";
import { useAuth } from "./AuthContext";

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, product: Omit<Product, "id">) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!user?.token) {
        setProducts([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/products`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch {
        setProducts([]);
      }
    };

    loadProducts();
  }, [user?.token]);

  const addProduct = useCallback(async (product: Omit<Product, "id">) => {
    if (!user?.token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error("Failed to add product");
    }

    const data = await response.json();
    setProducts((prev) => [data.product, ...prev]);
  }, [user?.token]);

  const updateProduct = useCallback(async (id: string, product: Omit<Product, "id">) => {
    if (!user?.token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error("Failed to update product");
    }

    const data = await response.json();
    setProducts((prev) => prev.map((p) => (p.id === id ? data.product : p)));
  }, [user?.token]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!user?.token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete product");
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, [user?.token]);

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be used within ProductProvider");
  return ctx;
}
