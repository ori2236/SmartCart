import fetch from "node-fetch";
import * as cheerio from "cheerio";
import find_stores from "../../models/FindStores.js"

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
  const availableProductIds = await Promise.all(
    products.map(async (p) => {
      const productId = p._id.toString();
      const productName = p.name;

      let storeEntry = await find_stores.findOne({
        cart_address: cartAddress,
        product_name: productName,
      });

      if (!storeEntry || !storeEntry.stores || storeEntry.stores.length === 0) {
        const scrapedStores = await fetchCHPStores(productName, cartAddress);

        if (scrapedStores.length > 0) {
          await find_stores.updateOne(
            { cart_address: cartAddress, product_name: productName },
            {
              $set: {
                stores: scrapedStores,
                last_updated: new Date(),
              },
            },
            { upsert: true }
          );

          storeEntry = { stores: scrapedStores };
        }
      }

      if (storeEntry && storeEntry.stores && storeEntry.stores.length > 0) {
        return productId;
      }

      return null;
    })
  );

  return availableProductIds.filter(Boolean);
}
