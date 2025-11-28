const express = require("express");
const axios = require("axios");
const router = express.Router();

// Import all necessary models at the top
const Brand = require("../models/brand");
const Category = require("../models/category");
const Product = require("../models/product");

// Import the auto-import service
const shopifyAutoImport = require("../services/shopifyAutoImport");

// GET /products - List all products (for testing in Postman)
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ created_at: -1 }).limit(50);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// This route fetches products from Shopify's API. It is correct.
router.post("/import-from-shopify", async (req, res) => {
  const { domain, token } = req.body;

  if (!domain || !token) {
    return res.status(400).json({ error: "Domain and token are required." });
  }

  const shopifyGraphQLEndpoint = `https://${domain}/api/2024-07/graphql.json`;

  const query = `
        query {
            products(first: 50) {
                edges {
                    node {
                        id
                        title
                        description
                        vendor
                        tags
                        images(first: 5) { edges { node { originalSrc } } }
                        variants(first: 10) { edges { node { title priceV2 { amount currencyCode } } } }
                    }
                }
            }
        }
    `;

  try {
    const response = await axios.post(
      shopifyGraphQLEndpoint,
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
      }
    );

    if (response.data.errors) {
      return res.status(400).json({ error: response.data.errors[0].message });
    }

    res.json({ products: response.data.data.products.edges });
  } catch (error) {
    console.error(
      "Shopify API Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to communicate with Shopify API. Check domain and token.",
    });
  }
});

// This route saves the fetched products to your database. THIS PART IS UPDATED.
// REPLACE your entire /products/batch-create route with this

router.post("/products/batch-create", async (req, res) => {
  const { products, brandName } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "Product data is required." });
  }

  try {
    const defaultCategoryName = "uncategorized";

    // 1. Find or create the Brand document by its name
    let brandDoc = await Brand.findOne({ name: brandName });
    if (!brandDoc) {
      console.log(`Brand "${brandName}" not found. Creating a new brand.`);

      // --- THIS IS THE PART THAT IS FIXED ---
      brandDoc = new Brand({
        name: brandName,
        email: `${brandName.toLowerCase().replace(/\s+/g, "")}@example.com`,
        password: "default-password",
        is_active: true,
        logo_url: "https://via.placeholder.com/150", // Default placeholder logo

        // Adding default values for other likely required fields
        store_addresses: [
          {
            street: "N/A",
            city: "N/A",
            state: "N/A",
            country: "N/A",
            pincode: "000000",
          },
        ],
        emergency_contact: {
          name: "Default Contact",
          email: "default@example.com",
          number: "0000000000",
          working_hours: "N/A",
        },
        bank_details: {
          account_number: "000000000000",
          ifsc_code: "DEFAULT000",
          upi_id: "default@upi",
        },
        social_links: [],
      });
      // --- END OF FIX ---

      await brandDoc.save();
    }

    // 2. Find or create the default Category document
    let categoryDoc = await Category.findOne({ name: defaultCategoryName });
    if (!categoryDoc) {
      categoryDoc = new Category({
        name: defaultCategoryName,
        image: "https://via.placeholder.com/150", // or any default image URL
      });
      await categoryDoc.save();
    }

    // 3. Map the products using the correct IDs

    // Prepare all product docs
    const productDocsRaw = products.map(({ node: product }) => ({
      name: product.title,
      description: product.description || "No description available.",
      price: product.variants.edges[0]?.node.priceV2.amount || 0,
      brand: brandDoc._id,
      images: product.images.edges.map((edge) => edge.node.originalSrc),
      currency: product.variants.edges[0]?.node.priceV2.currencyCode || "INR",
      category: [categoryDoc._id],
      stock: 100,
      is_active: true,
      tags: product.tags || [],
      sizes: product.variants.edges.map((edge) => edge.node.title) || [],
      fits: [],
      geo_tags: [],
      gender: "Unisex",
    }));

    // Filter out products that already exist (by name and brand)
    const existingProducts = await Product.find({
      brand: brandDoc._id,
      name: { $in: productDocsRaw.map((p) => p.name) },
    }).select("name");
    const existingNames = new Set(existingProducts.map((p) => p.name));
    const productDocs = productDocsRaw.filter(
      (p) => !existingNames.has(p.name)
    );

    if (productDocs.length === 0) {
      return res
        .status(200)
        .json({ message: "No new products to import (all are duplicates)." });
    }

    await Product.insertMany(productDocs);
    res.status(201).json({ message: "Products imported successfully" });
  } catch (error) {
    console.error("Batch product creation error:", error);
    res.status(500).json({
      error:
        "Failed to save products to the database. Check backend logs for details.",
    });
  }
});

// Route to get sync status
router.get("/sync-status", (req, res) => {
  const status = shopifyAutoImport.getStatus();
  res.json(status);
});

// Route to manually trigger import
router.post("/manual-trigger", async (req, res) => {
  try {
    await shopifyAutoImport.manualTrigger();
    res.json({ message: "Manual import triggered successfully" });
  } catch (error) {
    console.error("Manual trigger error:", error);
    res.status(500).json({ error: "Failed to trigger manual import." });
  }
});

// Route to auto-fetch from all configured stores
router.post("/auto-fetch-all", async (req, res) => {
  try {
    // Get all configured storefront tokens and domains from environment
    const storefrontTokensConfig =
      process.env.SHOPIFY_STOREFRONT_TOKENS?.split(",").map((d) => d.trim()) ||
      [];

    if (storefrontTokensConfig.length === 0) {
      return res.status(400).json({
        error: "No storefront tokens configured in environment variables.",
      });
    }

    console.log(
      `🔄 Auto-fetching from ${storefrontTokensConfig.length} stores using storefront tokens`
    );

    const results = [];

    for (const tokenDomainPair of storefrontTokensConfig) {
      try {
        // Parse token:domain format
        const [token, domain] = tokenDomainPair.split(":");

        if (!token || !domain) {
          console.log(`⚠️ Invalid token:domain format: ${tokenDomainPair}`);
          results.push({
            domain: domain || "unknown",
            success: false,
            error: "Invalid token:domain format",
          });
          continue;
        }

        console.log(`🔄 Processing store: ${domain}`);

        // Try Storefront API first (for public data)
        let products = [];
        let usedStorefront = true;

        try {
          const storefrontEndpoint = `https://${domain}/api/2024-07/graphql.json`;
          const query = `
            query {
  products(first: 250) {
    edges {
      node {
        id
        title
        description
        vendor
        tags
        productType
        updatedAt
        images(first: 5) {
          edges {
            node {
              originalSrc
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              title
              priceV2 {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
}

          `;

          const response = await axios.post(
            storefrontEndpoint,
            { query },
            {
              headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": token,
              },
            }
          );

          if (response.data.errors) {
            throw new Error(response.data.errors[0].message);
          }

          // Convert GraphQL response to product format
          products = response.data.data.products.edges.map(
            ({ node: product }) => {
              // Extract tags - handle different possible structures
              let extractedTags = [];
              if (
                product.tags &&
                Array.isArray(product.tags) &&
                product.tags.length > 0
              ) {
                extractedTags = product.tags;
              } else if (product.tags && typeof product.tags === "string") {
                extractedTags = product.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean);
              } else if (product.productType) {
                // Fallback to productType if tags are empty
                extractedTags = [product.productType];
              }

              return {
                title: product.title,
                body_html: product.description,
                vendor: product.vendor,
                tags: extractedTags,
                status: "active",
                variants: product.variants.edges.map(({ node: variant }) => ({
                  id: variant.title,
                  title: variant.title,
                  price: variant.priceV2.amount,
                  sku: "",
                  inventory_quantity: 100,
                  weight: 0,
                  weight_unit: "kg",
                })),
                images: product.images.edges.map(({ node: img }) => ({
                  src: img.originalSrc,
                })),
                id: product.id,
                handle: product.title.toLowerCase().replace(/\s+/g, "-"),
                product_type: "",
                published_at: product.updatedAt,
              };
            }
          );
        } catch (storefrontError) {
          console.log(
            `⚠️ Storefront API failed for ${domain}, trying Admin API...`
          );
          usedStorefront = false;

          // Fallback to Admin API if Storefront fails
          try {
            const adminEndpoint = `https://${domain}/admin/api/2024-07/products.json`;

            const adminResponse = await axios.get(adminEndpoint, {
              headers: {
                "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN,
                "Content-Type": "application/json",
              },
              params: {
                limit: 250,
                status: "active",
              },
            });

            if (adminResponse.data.errors) {
              throw new Error(adminResponse.data.errors[0].message);
            }

            products = adminResponse.data.products;
          } catch (adminError) {
            console.error(
              `❌ Both Storefront and Admin API failed for ${domain}:`,
              adminError.message
            );
            results.push({
              domain,
              success: false,
              error: `Both APIs failed: Storefront - ${storefrontError.message}, Admin - ${adminError.message}`,
            });
            continue;
          }
        }

        // Create or find brand for this store
        const brandDomain = domain.split(".")[0]; // Extract store name from domain

        let brandDoc = await Brand.findOne({ domain: brandDomain });

        if (!brandDoc) {
          brandDoc = new Brand({
            name: brandDomain,
            domain: brandDomain,
            email: `${brandDomain
              .toLowerCase()
              .replace(/\s+/g, "")}@example.com`,
            password: "default-password",
            is_active: true,
            logo_url: "https://via.placeholder.com/150",
            store_addresses: [
              {
                street: "N/A",
                city: "N/A",
                state: "N/A",
                country: "N/A",
                pincode: "000000",
              },
            ],
            emergency_contact: {
              name: "Default Contact",
              email: "default@example.com",
              number: "0000000000",
              working_hours: "N/A",
            },
            bank_details: {
              account_number: "000000000000",
              ifsc_code: "DEFAULT000",
              upi_id: "default@upi",
            },
            social_links: [],
            shopify_integration: {
              enabled: true,
              domain: domain,
              admin_token: process.env.SHOPIFY_ADMIN_TOKEN,
              storefront_token: token,
              last_sync: new Date(),
              products_count: products.length,
            },
          });
          await brandDoc.save();
        } else {
          // Update existing brand's Shopify integration
          await Brand.findByIdAndUpdate(brandDoc._id, {
            "shopify_integration.enabled": true,
            "shopify_integration.domain": domain,
            "shopify_integration.admin_token": process.env.SHOPIFY_ADMIN_TOKEN,
            "shopify_integration.storefront_token": token,
            "shopify_integration.last_sync": new Date(),
            "shopify_integration.products_count": products.length,
          });
        }

        // Ensure default category exists
        const defaultCategoryName = "uncategorized";
        let defaultCategoryDoc = await Category.findOne({
          name: defaultCategoryName,
        });
        if (!defaultCategoryDoc) {
          defaultCategoryDoc = new Category({
            name: defaultCategoryName,
            image: "https://via.placeholder.com/150",
          });
          await defaultCategoryDoc.save();
        }

        // Fetch all categories from DB (excluding uncategorized)
        const allCategories = await Category.find({
          _id: { $ne: defaultCategoryDoc._id },
        });

        // Helper to match categories
        function getMatchingCategories(product, categories, defaultCategoryId) {
          const productText = [
            product.title,
            product.product_type,
            ...(Array.isArray(product.tags) ? product.tags : []),
          ]
            .join(" ")
            .toLowerCase();

          const matched = categories
            .filter((cat) => productText.includes(cat.name.toLowerCase()))
            .map((cat) => cat._id);

          return matched.length > 0 ? matched : [defaultCategoryId];
        }

        const productDocs = products.map((product) => {
          // Extract tags for Admin API products
          let extractedTags = [];
          if (
            product.tags &&
            Array.isArray(product.tags) &&
            product.tags.length > 0
          ) {
            extractedTags = product.tags;
          } else if (product.tags && typeof product.tags === "string") {
            extractedTags = product.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean);
          } else if (product.product_type) {
            // Fallback to product_type if tags are empty
            extractedTags = [product.product_type];
          }

          return {
            name: product.title,
            description: product.body_html || "No description available.",
            price: product.variants?.[0]?.price || 0,
            brand: brandDoc._id,
            images: product.images?.map((img) => img.src) || [],
            currency: "INR",
            category: getMatchingCategories(
              product,
              allCategories,
              defaultCategoryDoc._id
            ),
            stock:
              product.variants?.reduce(
                (total, variant) => total + (variant.inventory_quantity || 0),
                0
              ) || 0,
            is_active: product.status === "active",
            tags: extractedTags,
            sizes:
              product.variants
                ?.map((variant) => variant.title)
                .filter(Boolean) || [],
            fits: [],
            geo_tags: [],
            gender: determineGender(product),
            shopify_id: product.id,
            shopify_handle: product.handle,
            vendor: product.vendor,
            product_type: product.product_type,
            published_at: product.published_at,
            variants:
              product.variants?.map((variant) => ({
                shopify_variant_id: variant.id,
                title: variant.title,
                price: variant.price,
                sku: variant.sku,
                inventory_quantity: variant.inventory_quantity,
                weight: variant.weight,
                weight_unit: variant.weight_unit,
              })) || [],
          };
        });

        // Helper function to determine gender
        function determineGender(product) {
          const title = product.title?.toLowerCase() || "";
          const tags = Array.isArray(product?.tags)
            ? product.tags.join(" ").toLowerCase()
            : product.tags?.toLowerCase() || "";
          const productType = product.product_type?.toLowerCase() || "";

          if (product.vendor === "Pose") {
            return "female";
          }

          if (
            title.includes("men") ||
            tags.includes("men") ||
            productType.includes("men")
          ) {
            return "male";
          } else if (
            title.includes("women") ||
            tags.includes("women") ||
            productType.includes("women")
          ) {
            return "female";
          } else if (
            title.includes("unisex") ||
            tags.includes("unisex") ||
            productType.includes("unisex")
          ) {
            return "unisex";
          }
          return "unisex";
        }

        // Check for existing products and update or create
        for (const productDoc of productDocs) {
          const existingProduct = await Product.findOne({
            brand: brandDoc._id,
            shopify_id: productDoc.shopify_id,
          });

          if (existingProduct) {
            if (
              new Date(productDoc.published_at) >
              new Date(existingProduct.published_at)
            ) {
              await Product.findByIdAndUpdate(existingProduct._id, {
                ...productDoc,
                published_at: productDoc.published_at,
              });
            } else {
              // skip because nothing changed
              continue;
            }
          } else {
            await Product.create(productDoc);
          }
        }

        results.push({
          domain,
          success: true,
          productsCount: products.length,
          brandId: brandDoc._id,
          brandName: brandDoc.name,
          usedStorefront,
        });

        // Add delay to avoid rate limiting
        await new Promise((resolve) =>
          setTimeout(resolve, process.env.SHOPIFY_API_DELAY || 1000)
        );
      } catch (error) {
        console.error(
          `❌ Error processing store ${tokenDomainPair}:`,
          error.message
        );
        results.push({
          domain: tokenDomainPair.split(":")[1] || "unknown",
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      message: "Auto-fetch completed",
      results,
      totalStores: storefrontTokensConfig.length,
      successfulStores: results.filter((r) => r.success).length,
    });
  } catch (error) {
    console.error("Auto-fetch error:", error);
    res.status(500).json({ error: "Failed to auto-fetch from stores." });
  }
});

// Enhanced import using Admin API for more data
router.post("/import-with-admin-api", async (req, res) => {
  const { domain, brandName } = req.body;

  if (!domain || !brandName) {
    return res
      .status(400)
      .json({ error: "Domain and brand name are required." });
  }

  try {
    // Find or create brand
    let brandDoc = await Brand.findOne({ name: brandName });
    if (!brandDoc) {
      brandDoc = new Brand({
        name: brandName,
        domain: brandName,
        email: `${brandName.toLowerCase().replace(/\s+/g, "")}@example.com`,
        password: "default-password",
        is_active: true,
        logo_url: "https://via.placeholder.com/150",
        store_addresses: [
          {
            street: "N/A",
            city: "N/A",
            state: "N/A",
            country: "N/A",
            pincode: "000000",
          },
        ],
        emergency_contact: {
          name: "Default Contact",
          email: "default@example.com",
          number: "0000000000",
          working_hours: "N/A",
        },
        bank_details: {
          account_number: "000000000000",
          ifsc_code: "DEFAULT000",
          upi_id: "default@upi",
        },
        social_links: [],
      });
      await brandDoc.save();
    }

    // Use Admin API for comprehensive data
    const adminEndpoint = `https://${domain}/admin/api/2024-07/products.json`;

    const response = await axios.get(adminEndpoint, {
      headers: {
        "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN,
        "Content-Type": "application/json",
      },
      params: {
        limit: 250,
        status: "active",
      },
    });

    if (response.data.errors) {
      return res.status(400).json({ error: response.data.errors[0].message });
    }

    const products = response.data.products;

    // Fetch all categories from DB
    const allCategories = await Category.find();

    // Ensure uncategorized exists (create if missing)
    let uncategorized = await Category.findOne({ name: "uncategorized" });
    if (!uncategorized) {
      uncategorized = new Category({
        name: "uncategorized",
        image: "https://via.placeholder.com/150",
      });
      await uncategorized.save();
    }

    // Helper: match categories by checking title, tags, productType
    function getMatchingCategories(product, categories, uncategorizedId) {
      const productText = [
        product.title,
        product.product_type,
        ...(Array.isArray(product.tags) ? product.tags : []),
      ]
        .join(" ")
        .toLowerCase();

      const matched = categories
        .filter(
          (cat) =>
            cat.name.toLowerCase() !== "uncategorized" && // skip uncategorized during matching
            productText.includes(cat.name.toLowerCase())
        )
        .map((cat) => cat._id);

      // 👉 If no matches, assign uncategorized
      return matched.length > 0 ? matched : [uncategorizedId];
    }

    const productDocs = products.map((product) => {
      // Extract tags for Admin API products
      let extractedTags = [];
      if (
        product.tags &&
        Array.isArray(product.tags) &&
        product.tags.length > 0
      ) {
        extractedTags = product.tags;
      } else if (product.tags && typeof product.tags === "string") {
        extractedTags = product.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
      } else if (product.product_type) {
        // Fallback to product_type if tags are empty
        extractedTags = [product.product_type];
      }

      return {
        name: product.title,
        description: product.body_html || "No description available.",
        price: product.variants?.[0]?.price || 0,
        brand: brandDoc._id,
        images: product.images?.map((img) => img.src) || [],
        currency: "INR",
        category: getMatchingCategories(
          product,
          allCategories,
          defaultCategoryDoc._id
        ),
        stock:
          product.variants?.reduce(
            (total, variant) => total + (variant.inventory_quantity || 0),
            0
          ) || 0,
        is_active: product.status === "active",
        tags: extractedTags,
        sizes:
          product.variants?.map((variant) => variant.title).filter(Boolean) ||
          [],
        fits: [],
        geo_tags: [],
        gender: determineGender(product),
        shopify_id: product.id,
        shopify_handle: product.handle,
        vendor: product.vendor,
        product_type: product.product_type,
        published_at: product.published_at,
        variants:
          product.variants?.map((variant) => ({
            shopify_variant_id: variant.id,
            title: variant.title,
            price: variant.price,
            sku: variant.sku,
            inventory_quantity: variant.inventory_quantity,
            weight: variant.weight,
            weight_unit: variant.weight_unit,
          })) || [],
      };
    });

    // Helper function to determine gender
    function determineGender(product) {
      const title = product.title?.toLowerCase() || "";
      const tags = Array.isArray(product?.tags)
        ? product.tags.join(" ").toLowerCase()
        : product.tags?.toLowerCase() || "";
      const productType = product.product_type?.toLowerCase() || "";

      if (product.vendor === "Pose") return "female";

      if (
        title.includes("men") ||
        tags.includes("men") ||
        productType.includes("men")
      ) {
        return "male";
      } else if (
        title.includes("women") ||
        title.includes("female") ||
        tags.includes("women") ||
        tags.includes("female") ||
        productType.includes("women") ||
        productType.includes("female")
      ) {
        return "female";
      } else if (
        title.includes("unisex") ||
        tags.includes("unisex") ||
        productType.includes("unisex")
      ) {
        return "unisex";
      }
      return "unisex";
    }

    // Check for existing products and update or create
    for (const productDoc of productDocs) {
      const existingProduct = await Product.findOne({
        brand: brandDoc._id,
        shopify_id: productDoc.shopify_id,
      });

      if (existingProduct) {
        if (
          new Date(productDoc.published_at) >
          new Date(existingProduct.published_at)
        ) {
          await Product.findByIdAndUpdate(existingProduct._id, {
            ...productDoc,
            published_at: productDoc.published_at,
          });
        } else {
          // skip because nothing changed
          continue;
        }
      } else {
        await Product.create(productDoc);
      }
    }

    // Update brand's last sync time
    await Brand.findByIdAndUpdate(brandDoc._id, {
      "shopify_integration.last_sync": new Date(),
      "shopify_integration.products_count": products.length,
    });

    res.status(201).json({
      message: "Products imported successfully with Admin API",
      productsCount: products.length,
      brandId: brandDoc._id,
    });
  } catch (error) {
    console.error(
      "Admin API import error:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ error: "Failed to import products with Admin API." });
  }
});

module.exports = router;
