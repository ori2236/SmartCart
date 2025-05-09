import fetch from "node-fetch";
import { load } from "cheerio";
import findStores from "../../models/FindStores.js";
import findPrices from "../../models/FindPrices.js";
import NotFoundStores from "../../models/NotFoundStores.js";

function parseDiscountText(discount_text) {
  let required_quantity = 1;
  if (/(\d+)\s*יחידות/.test(discount_text)) {
    required_quantity = parseInt(RegExp.$1, 10);
  } else if (/קנה אחד, קבל את השני/.test(discount_text)) {
    required_quantity = 2;
  }
  return required_quantity;
}

async function fetchCHPStores(productName, shoppingAddress) {
  try {
    const url = "https://chp.co.il/main_page/compare_results";
    const params = new URLSearchParams({
      shopping_address: shoppingAddress,
      product_name_or_barcode: productName,
    });

    const response = await fetch(`${url}?${params}`);
    const html = await response.text();

    const $ = load(html);
    const table = $(".results-table");

    if (!table || !table.length) return [];

    const rows = table.find("tr").slice(1);  //skip titles
    const results = [];

    //extract store name, address and prices from each row
    rows.each((_, row) => {
      const cols = $(row)
        .find("td")
        .toArray()
        .map((td) => $(td).text().trim());
      if (cols.length < 4) return;

      const storeName = cols[0];
      const storeAddress = cols[2];
      const saleRaw = cols[cols.length - 2].replace(/[^\d.]/g, ""); //only numbers and "."
      const salePrice = parseFloat(saleRaw) || null;
      const regRaw = cols[cols.length - 1].replace(/[^\d.]/g, "");
      const regularPrice = parseFloat(regRaw) || null;
      let requiredQuantity = null;
      if (salePrice){
        // if there’s a discount button on this row
        const discBtn = $(row).find("button.btn-discount");
        requiredQuantity = discBtn.length
          ? parseDiscountText(discBtn.attr("data-discount-desc"))
          : null;
      }

      results.push({
        storeName,
        storeAddress,
        regularPrice,
        salePrice,
        requiredQuantity,
      });
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

  const [storeEntries, priceEntries, notFoundEntries] = await Promise.all([
    findStores.find({
      cart_address: cartAddress,
      product_name: { $in: productNames },
    }),
    findPrices.find({ product_name: { $in: productNames } }),
    NotFoundStores.find({
      cart_address: cartAddress,
      productId: { $in: productIds },
    }),
  ]);

  //convert store results to a map
  const storeMap = new Map(storeEntries.map((e) => [e.product_name, e]));
  const notFoundSet = new Set(notFoundEntries.map((e) => e.productId));

  const priceMap = new Map(
    priceEntries.map((e) => [
      `${e.product_name}|${e.store_name}|${e.store_address}`,
      e,
    ])
  );

  const missingStoresEntries = [];
  const missingPricesEntries = [];
  const availableProducts = [];
  const notFoundToInsert = [];

  //same time
  await Promise.all(
    products.map(async (p) => {
      const productId = p._id.toString();
      const name = p.name;
      const entry = storeMap.get(name);

      //if there is stores in the cart address area that sell the product
      if (entry?.stores?.length) {
        availableProducts.push([productId, entry.stores.length]);
        return;
      }

      //if we know that the product is not sells in the cart address
      if (notFoundSet.has(productId)) return;

      //fetch from CHP
      const rawStores = await fetchCHPStores(name, cartAddress);

      //skip any store where the address contains "http"
      const sellingStores = rawStores.filter(
        (s) => !s.storeAddress.toLowerCase().includes("http")
      );

      //the product is sells in the cart address (there is stores)
      if (sellingStores.length) {
        availableProducts.push([productId, sellingStores.length]);
        //update findStores later with the info
        missingStoresEntries.push({
          cart_address: cartAddress,
          product_name: name,
          stores: sellingStores.map((s) => [s.storeName, s.storeAddress]),
          last_updated: new Date(),
        });

        sellingStores.forEach((s) => {
          //update findPrices later with the info
          missingPricesEntries.push({
            name,
            storeName: s.storeName,
            storeAddress: s.storeAddress,
            regularPrice: s.regularPrice,
            salePrice: s.salePrice,
            requiredQuantity: s.requiredQuantity,
          });
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

  if (missingStoresEntries.length) {
    try {
      await findStores.insertMany(missingStoresEntries, { ordered: false });
    } catch (err) {
      console.warn("insertMany findStores:", err.message);
    }
  }

  if (notFoundToInsert.length) {
    try {
      await NotFoundStores.insertMany(notFoundToInsert, { ordered: false });
    } catch (err) {
      console.warn("insertMany notFoundStores:", err.message);
    }
  }

  if (missingPricesEntries.length) {
    const now = new Date();
    const bulkOps = missingPricesEntries.map((item) => ({
      updateOne: {
        filter: {
          product_name: item.name,
          store_name: item.storeName,
          store_address: item.storeAddress,
        },
        update: {
          $set: {
            regular_price: item.regularPrice,
            sale_price: item.salePrice,
            required_quantity: item.requiredQuantity,
            last_updated: now,
          },
        },
        upsert: true,
      },
    }));

    await findPrices.bulkWrite(bulkOps);
  }

  return availableProducts;
}
