import fetch from "node-fetch";
import * as cheerio from "cheerio";
import find_stores from "../../models/FindStores.js";
import notFoundStores from "../../models/NotFoundStores.js";

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

    //extract store name and address from each row
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
    console.error("fetch from CHP failed:", err.message);
    return [];
  }
}

export async function filterAvailableProducts(products, cartAddress) {
  const productNames = products.map((p) => p.name);
  const storeEntries = await find_stores.find({
    cart_address: cartAddress,
    product_name: { $in: productNames },
  });

  //convert store results to a map
  const storeMap = new Map();
  storeEntries.forEach((entry) => {
    storeMap.set(entry.product_name, entry);
  });

  const notFoundEntries = await notFoundStores.find({
    cart_address: cartAddress,
    product_name: { $in: productNames },
  });
  const notFoundSet = new Set(notFoundEntries.map((e) => e.product_name));

  const missingEntries = [];
  const availableProductIds = [];
  const notFoundToInsert = [];

  //same time
  await Promise.all(
    products.map(async (p) => {
      const productId = p._id.toString();
      const productName = p.name;

      const storeEntry = storeMap.get(productName);

      //if there is stores in the cart address area that sell the product
      if (storeEntry && storeEntry.stores && storeEntry.stores.length > 0) {
        availableProductIds.push(productId);
        return;
      }

      //if we know that the product is not sells in the cart address
      if (notFoundSet.has(productName)) return;

      //fetch from CHP
      const sellingStores = await fetchCHPStores(productName, cartAddress);

      //the product is sells in the cart address (there is stores)
      if (sellingStores.length > 0) {
        availableProductIds.push(productId);
        //update FindStores later with the info
        missingEntries.push({
          cart_address: cartAddress,
          product_name: productName,
          stores: sellingStores,
          last_updated: new Date(),
        });
      } else {
        //update NotFoundStores later with the info
        notFoundToInsert.push({
          cart_address: cartAddress,
          product_name: productName,
          last_updated: new Date(),
        });
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

  if (notFoundToInsert.length > 0) {
    try {
      await notFoundStores.insertMany(notFoundToInsert, { ordered: false });
    } catch (e) {
      console.warn("insertMany error:", e.message);
    }
  }

  return availableProductIds;
}
