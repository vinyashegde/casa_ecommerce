// src/components/ShopifyImport.js (Updated Frontend Code)

import React, { useState, useEffect } from "react";
import { useBrand } from "../contexts/BrandContext";
import {
  Upload,
  Download,
  Package,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

const ShopifyImport = () => {
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [storefrontApiToken, setStorefrontApiToken] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const { brand, setBrand } = useBrand();

  const handleFetchProducts = async () => {
    if (!shopifyDomain || !storefrontApiToken) {
      setError("Please enter a Shopify domain and Storefront API token.");
      return;
    }

    setLoading(true);
    setError("");
    setImportSuccess("");
    setProducts([]);

    try {
      // This now calls YOUR backend server, not Shopify's
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await fetch(`${apiUrl}/import-from-shopify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: shopifyDomain,
          token: storefrontApiToken,
        }),
      });

      const data = await response.json();
      console.log("data: ", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch products from backend.");
      }

      if (data.products && data.products.length > 0) {
        setProducts(data.products);
        setImportSuccess(
          `${data.products.length} products fetched successfully. Click "Import Products" to save them to your CRM.`
        );
      } else {
        setError("No products found for this store.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportProducts = async () => {
    setLoading(true);
    setError("");
    setImportSuccess("");
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await fetch(`${apiUrl}/products/batch-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products,
          brandName: products[0]?.node?.vendor,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to import products to CRM.");
      }

      setImportSuccess("All products imported successfully!");
      setProducts([]); // Clear products after import
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // New function to import with Admin API
  const handleImportWithAdminAPI = async () => {
    if (!shopifyDomain) {
      setError("Please enter Shopify domain.");
      return;
    }

    setLoading(true);
    setError("");
    setImportSuccess("");

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await fetch(`${apiUrl}/import-with-admin-api`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: shopifyDomain,
          adminToken: adminApiToken,
          brandName: brand?.name || "Default Brand",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import with Admin API.");
      }

      setImportSuccess(
        `Successfully imported ${data.productsCount} products with Admin API!`
      );
      setProducts([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get sync status
  const fetchSyncStatus = async () => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await fetch(`${apiUrl}/sync-status`);
      const data = await response.json();
      setSyncStatus(data);
      setLastSyncTime(data.lastSyncTime);
    } catch (err: any) {
      console.error("Failed to fetch sync status:", err);
    }
  };

  // Manual trigger
  const handleManualTrigger = async () => {
    setLoading(true);
    setError("");
    setImportSuccess("");

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await fetch(`${apiUrl}/manual-trigger`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to trigger manual import.");
      }

      setImportSuccess("Manual import triggered successfully!");
      setTimeout(fetchSyncStatus, 2000); // Refresh status after 2 seconds
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch from all configured stores
  const handleAutoFetchAll = async () => {
    setLoading(true);
    setError("");
    setImportSuccess("");

    try {
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5002/api";
      const response = await fetch(`${apiUrl}/auto-fetch-all`, {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to auto-fetch from stores.");
      }

      setImportSuccess(
        `Auto-fetch completed! Processed ${data.totalStores} stores, ${data.successfulStores} successful.`
      );
      // setProducts(data)
      setTimeout(fetchSyncStatus, 2000); // Refresh status after 2 seconds
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sync status on component mount
  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-800 text-white">
      <h2 className="text-2xl font-bold mb-4">Import Products from Shopify</h2>
      {/* Sync Status Display */}
      {syncStatus && (
        <div className="mb-6 p-4 bg-slate-700 rounded border border-slate-600">
          <h3 className="text-lg font-semibold mb-2">🔄 Sync Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Status:</span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  syncStatus.syncStatus === "running"
                    ? "bg-yellow-600 text-yellow-100"
                    : syncStatus.syncStatus === "completed"
                    ? "bg-green-600 text-green-100"
                    : syncStatus.syncStatus === "failed"
                    ? "bg-red-600 text-red-100"
                    : "bg-slate-600 text-slate-100"
                }`}
              >
                {syncStatus.syncStatus}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Running:</span>
              <span className="ml-2">
                {syncStatus.isRunning ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Last Sync:</span>
              <span className="ml-2">
                {lastSyncTime
                  ? new Date(lastSyncTime).toLocaleString()
                  : "Never"}
              </span>
            </div>
            <div>
              <button
                onClick={handleManualTrigger}
                disabled={loading || syncStatus.isRunning}
                className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 disabled:bg-slate-500"
              >
                Manual Trigger
              </button>
            </div>
            <div>
              <button
                onClick={handleAutoFetchAll}
                disabled={loading || syncStatus.isRunning}
                className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 disabled:bg-slate-500"
              >
                Auto-Fetch All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="your-store.myshopify.com"
          value={shopifyDomain}
          onChange={(e) => setShopifyDomain(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-white placeholder-slate-400"
        />
        <input
          type="text"
          placeholder="Storefront API Token"
          value={storefrontApiToken}
          onChange={(e) => setStorefrontApiToken(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-white placeholder-slate-400"
        />

        <div className="flex space-x-2">
          <button
            onClick={handleFetchProducts}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-slate-500 flex-1"
          >
            {loading ? "Fetching..." : "Fetch Products"}
          </button>
          {/* <button
            onClick={handleImportWithAdminAPI}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-slate-500 flex-1"
          >
            {loading ? "Importing..." : "Import with Admin API"}
          </button> */}
        </div>
      </div>

      {error && (
        <p className="text-red-400 bg-red-900/50 p-3 rounded">{error}</p>
      )}
      {importSuccess && (
        <p className="text-green-400 bg-green-900/50 p-3 rounded">
          {importSuccess}
        </p>
      )}

      {products.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Fetched Products</h3>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {products.map(({ node: product }) => (
              <li
                key={product.id}
                className="bg-slate-700 border border-slate-600 p-4 rounded"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={product.images.edges[0]?.node.originalSrc}
                    alt={product.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h4 className="font-bold">{product.title}</h4>
                    <p className="text-sm text-slate-400">
                      {product.variants.edges[0]?.node.priceV2.amount}{" "}
                      {product.variants.edges[0]?.node.priceV2.currencyCode}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={handleImportProducts}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded mt-4 hover:bg-green-700 disabled:bg-slate-500 w-full"
          >
            {loading ? "Importing..." : `Import ${products.length} Products`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopifyImport;
