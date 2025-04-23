import fetch from "node-fetch";
import * as cheerio from "cheerio";
import find_stores from "../../models/FindStores.js";

async function fetchCHPStores(productName, shoppingAddress) {
  try {
    const url = "https://chp.co.il/main_page/compare_results";
    const params = new URLSearchParams({
      shopping_address: shoppingAddress,
      product_name_or_barcode: productName,
    });

    const response = await fetch(`${url}?${params}`);
    const html = await response.text();

    const $ = cheerio.load(html);
    const table = $(".results-table");

    if (!table || !table.length) return [];

    const rows = table.find("tr").slice(1);
    const results = [];

    rows.each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length >= 4) {
        const storeName = $(cols[0]).text().trim();
        const storeAddress = $(cols[2]).text().trim();
        if (storeName && storeAddress) {
          results.push([storeName, storeAddress]);
        }
      }
    });

    return results;
  } catch (err) {
    console.error("CHP scrape failed:", err.message);
    return [];
  }
}

export async function filterAvailableProducts(products, cartAddress) {
  const productNames = products.map((p) => p.name);
  const storeEntries = await find_stores.find({
    cart_address: cartAddress,
    product_name: { $in: productNames },
  });

  const storeMap = new Map();
  storeEntries.forEach((entry) => {
    storeMap.set(entry.product_name, entry);
  });

  const missingEntries = [];
  const availableProductIds = [];

  await Promise.all(
    products.map(async (p) => {
      const productId = p._id.toString();
      const productName = p.name;

      const storeEntry = storeMap.get(productName);

      if (storeEntry && storeEntry.stores && storeEntry.stores.length > 0) {
        availableProductIds.push(productId);
        return;
      }

      const sellingStores = await fetchCHPStores(productName, cartAddress);

      if (sellingStores.length > 0) {
        availableProductIds.push(productId);
        missingEntries.push({
          cart_address: cartAddress,
          product_name: productName,
          stores: sellingStores,
          last_updated: new Date(),
        });
      } else {
        console.log(`No stores found for ${productName} at ${cartAddress}`);
      }
    })
  );

  if (missingEntries.length > 0) {
    try {
      await find_stores.insertMany(missingEntries, { ordered: false });
    } catch (error) {
      console.warn("insertMany error:", error.message);
    }
  }

  return availableProductIds;
}
