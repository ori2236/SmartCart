import CartHistory from "../../models/CartHistory.js";
import RejectedProducts from "../../models/RejectedProducts.js";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import Favorite from "../../models/Favorite.js";
import { cleanAddress } from "./suggestions.js";
import { filterAvailableProducts } from "./availableProducts.js";
/*

|---------------------------|--------|--------------------------------------------------------------|
| Feature Name              | Type   | Description                                                  |
|---------------------------|--------|--------------------------------------------------------------|
| isFavorite                | 0/1    | whether the product is in the user's favorites list          | done
| purchasedBefore           | 0/1    | whether the product was purchased in this cart before        | done
| timesPurchased            | int    | how many times the product was purchased in this cart        | done
| recentlyPurchased         | 0/1    | whether it was purchased in the last 30 days                 | done
| storeCount                | int    | the amount of stores selling the product in the cart area    | done
| timesWasRejectedByUser    | int    | the amount of times the product was rejected by the user     | done
| timesWasRejectedByCart    | int    | the amount of times the product was rejected by the cart     | done
|---------------------------|--------|--------------------------------------------------------------|

*/

export async function fetchFeaturesSuggestions(productsMap, cartKey, mail) {
  const productIds = Array.from(productsMap.keys());

  const [rejectionsMap, cartHistoryMap] = await Promise.all([
    (async () => {
      const rejections = await RejectedProducts.find({
        cartKey,
        productId: { $in: productIds },
      }).lean();

      const rejectionsMap = new Map();

      for (const { productId, rejectedBy } of rejections) {
        const productStats = rejectionsMap.get(productId) || {
          timesWasRejectedByCart: 0,
          timesWasRejectedByUser: 0,
        };

        productStats.timesWasRejectedByCart += 1;

        if (rejectedBy === mail) {
          productStats.timesWasRejectedByUser += 1;
        }

        rejectionsMap.set(productId, productStats);
      }
      return rejectionsMap;
    })(),
    (async () => {
      const limit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); //30 days

      const cartHistory = await CartHistory.find({
        cartKey,
        productId: { $in: productIds },
      }).lean();

      const cartHistoryMap = new Map();

      for (const { productId, date } of cartHistory) {
        if (!cartHistoryMap.has(productId)) {
          cartHistoryMap.set(productId, {
            purchasedBefore: 0,
            timesPurchased: 0,
            recentlyPurchased: 0,
          });
        }

        const productData = cartHistoryMap.get(productId);
        productData.timesPurchased += 1;

        if (new Date(date) >= limit) {
          productData.recentlyPurchased = 1;
        }

        productData.purchasedBefore = 1;
      }
      return cartHistoryMap;
    })(),
  ]);

  for (const [productId, productMeta] of productsMap.entries()) {
    const {
      purchasedBefore = 0,
      timesPurchased = 0,
      recentlyPurchased = 0,
    } = cartHistoryMap.get(productId) || {};

    const { timesWasRejectedByCart = 0, timesWasRejectedByUser = 0 } =
      rejectionsMap.get(productId) || {};

    //features
    productsMap.set(productId, {
      ...productMeta,
      purchasedBefore,
      timesPurchased,
      recentlyPurchased,
      timesWasRejectedByCart,
      timesWasRejectedByUser,
    });
  }

  return productsMap;
}

export async function fetchAllFeatures(productId, cartKey, mail) {
  const initialMap = new Map([[productId.toString(), {}]]);

  const [historyMap, favoriteSet, storeCountMap] = await Promise.all([
    // history + rejection features
    fetchFeaturesSuggestions(initialMap, cartKey, mail),

    // favorites
    Favorite.find({ mail })
      .lean()
      .then((favs) => new Set(favs.map((f) => f.productId.toString()))),

    //store count
    (async () => {
      const product = await Product.findById(productId).lean();
      const cart = await Cart.findById(cartKey);
      if (!cart) {
        console.error("Cart not found");
        return null;
      }
      const cartAddress = cleanAddress(cart.address);
      const productsList = await filterAvailableProducts(
        [product],
        cartAddress
      );
      return new Map(productsList);
    })(),
  ]);

  const productsMap = new Map();
  for (const [productId, productMeta] of historyMap.entries()) {
    //features
    productsMap.set(productId, {
      ...productMeta,
      isFavorite: favoriteSet.has(productId) ? 1 : 0,
      storeCount: storeCountMap.get(productId) ?? 0,
    });
  }

  return productsMap;
}
