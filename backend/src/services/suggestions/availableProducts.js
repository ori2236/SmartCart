import fetch from "node-fetch";
import * as cheerio from "cheerio";
import find_stores from "../../models/FindStores.js";
import NotFoundStores from "../../models/NotFoundStores.js";

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
  const productIds = products.map((p) => p._id.toString());

  const [storeEntries, notFoundEntries] = await Promise.all([
    find_stores.find({
      cart_address: cartAddress,
      product_name: { $in: productNames },
    }),
    NotFoundStores.find({
      cart_address: cartAddress,
      productId: { $in: productIds },
    }),
  ]);

  //convert store results to a map
  const storeMap = new Map(storeEntries.map((e) => [e.product_name, e]));
  const notFoundSet = new Set(notFoundEntries.map((e) => e.productId));

  const missingEntries = [];
  const availableProducts = [];
  const notFoundToInsert = [];

  //same time
  await Promise.all(
    products.map(async (p) => {
      const name = p.name;
      const entry = storeMap.get(name);

      //if there is stores in the cart address area that sell the product
      if (entry?.stores?.length) {
        availableProducts.push([p._id.toString(), entry.stores.length]);
        return;
      }

      //if we know that the product is not sells in the cart address
      if (notFoundSet.has(p._id.toString())) return;

      //fetch from CHP
      const sellingStores = await fetchCHPStores(name, cartAddress);

      //the product is sells in the cart address (there is stores)
      if (sellingStores.length > 0) {
        availableProducts.push([p._id.toString(), sellingStores.length]);
        //update FindStores later with the info
        missingEntries.push({
          cart_address: cartAddress,
          product_name: name,
          stores: sellingStores,
          last_updated: new Date(),
        });
      } else {
        //update NotFoundStores later with the info
        notFoundToInsert.push({
          cart_address: cartAddress,
          product_name: name,
          productId: p._id.toString(),
          last_updated: new Date(),
        });
      }
    })
  );

  if (missingEntries.length) {
    try {
      await find_stores.insertMany(missingEntries, { ordered: false });
    } catch (err) {
      console.warn("insertMany find_stores:", err.message);
    }
  }

  if (notFoundToInsert.length) {
    try {
      await NotFoundStores.insertMany(notFoundToInsert, { ordered: false });
    } catch (err) {
      console.warn("insertMany notFoundStores:", err.message);
    }
  }

  return availableProducts;
}
