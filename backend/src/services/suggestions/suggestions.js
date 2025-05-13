import basedEveryProduct from "./algorithms/basedEveryProduct.js";
import ProductInCart from "../../models/ProductInCart.js";
import trendingProducts from "./algorithms/trendingProducts.js";
import intervals from "./algorithms/intervals.js";
import mostPurchased from "./algorithms/mostPurchased.js";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import RejectedProducts from "../../models/RejectedProducts.js";
import Favorite from "../../models/Favorite.js";
import NotFoundStores from "../../models/NotFoundStores.js";
import { filterAvailableProducts } from "./availableProducts.js";
import { fetchFeaturesSuggestions } from "./features.js";
import { rankProducts } from "./predictPurchases.js";

export function cleanAddress(address) {
  address = address.trim();
  if (address.endsWith("ישראל")) {
    address = address.slice(0, address.length - "ישראל".length).trim();
  }
  return address.replace(/,+$/, "").trim();
}

//apply the algorithms to finf products
async function getProducts(
  cartProductIdsSet,
  shouldNotSuggest,
  cartKey,
  times
) {
  const [
    basedEveryProductResponse,
    trendingProductsResponse,
    intervalsResponse,
    mostPurchasedResponse,
  ] = await Promise.all([
    basedEveryProduct([...cartProductIdsSet], times),
    trendingProducts([...cartProductIdsSet], times),
    intervals([...cartProductIdsSet], cartKey, times),
    mostPurchased([...shouldNotSuggest], cartKey, times),
  ]);

  const all = [
    ...basedEveryProductResponse,
    ...trendingProductsResponse,
    ...intervalsResponse,
    ...mostPurchasedResponse,
  ];

  //make sure that the suggestions are not in shouldNotSuggest
  const filtered = all.filter(
    (item) =>
      item?.productId && !shouldNotSuggest.has(item.productId.toString())
  );

  return filtered;
}

export async function getFilteredProducts(cartKey, mail, k, onRound) {
  const cart = await Cart.findById(cartKey);
  if (!cart) {
    console.error("Cart not found");
    return null;
  }
  const cartAddress = cleanAddress(cart.address);

  const [
    cartProductIdsArr,
    rejectedProductsIdsArr,
    favoriteIds,
    notFoundProductIdsArr,
  ] = await Promise.all([
    ProductInCart.find({ cartKey }).then((docs) =>
      docs.map((p) => p.productId.toString())
    ),
    RejectedProducts.find({ cartKey, rejectedBy: mail }).then((docs) => {
      const limit = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); //2 weeks
      return docs
        .filter((doc) => doc.createdAt >= limit)
        .map((p) => p.productId.toString());
    }),
    Favorite.find({ mail })
      .lean()
      .then((favs) => new Set(favs.map((f) => f.productId.toString()))),
    NotFoundStores.find({ cart_address: cartAddress }).then((entries) =>
      entries.map((e) => e.productId)
    ),
  ]);

  if (!cart) {
    console.error("Cart not found");
    return null;
  }

  const cartProductIdsSet = new Set(cartProductIdsArr);
  const rejectedProductsIdsSet = new Set(rejectedProductsIdsArr);
  const MAX_ROUNDS = 4;
  try {
    const shouldNotSuggest = new Set([
      ...cartProductIdsSet,
      ...rejectedProductsIdsSet,
      ...notFoundProductIdsArr,
    ]);
    const availableProductEntries = new Map(); // productId -> productData

    let round = 0;

    //make sure that suggest enough products
    while (round < MAX_ROUNDS && availableProductEntries.size < 6) {
      round++;
      onRound?.(round);

      //get the products from the algorithms
      const newRecommendations = await getProducts(
        cartProductIdsSet,
        shouldNotSuggest,
        cartKey,
        Math.pow(k, round)
      );

      newRecommendations.forEach((rec) => {
        shouldNotSuggest.add(rec.productId.toString());
      });

      const newProductIds = newRecommendations.map((rec) =>
        rec.productId.toString()
      );
      const products = await Product.find({ _id: { $in: newProductIds } });

      //make sure that the suggested product indeed selling in the cart area
      const newAvailableEntries = await filterAvailableProducts(
        products,
        cartAddress
      );

      for (const [productId, storeCount] of newAvailableEntries) {
        const product = products.find((p) => p._id.toString() === productId);

        if (product && !availableProductEntries.has(productId)) {
          availableProductEntries.set(productId, {
            product,
            storeCount,
            isFavorite: favoriteIds.has(productId),
          });
        }
      }
    }

    if (availableProductEntries.size === 0) {
      console.log("no recommendations available");
      return new Map();
    }

    //fetch the features of the products
    const features = await fetchFeaturesSuggestions(
      availableProductEntries,
      cartKey,
      mail
    );

    return features; //Map <productId, meta>
  } catch (err) {
    console.error("Recommendation error:", err.message);
  }
}

async function suggestions(cartKey, mail, k, onRound) {
  try {
    const features = await getFilteredProducts(cartKey, mail, k, onRound);

    if (!features || features.size === 0) {
      return [];
    }

    const sortedProductIds = await rankProducts(features);

    const suggestions = sortedProductIds.map(({ productId }) => {
      const meta = features.get(productId);
      return {
        productId,
        name: meta.product.name,
        image: meta.product.image,
        isFavorite: meta.isFavorite,
      };
    });

    return suggestions;
  } catch (err) {
    console.error("Recommendation error:", err.message);
  }
}

export default suggestions;
