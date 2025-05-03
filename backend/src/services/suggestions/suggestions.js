import basedEveryProduct from "./algorithms/basedEveryProduct.js";
import ProductInCart from "../../models/ProductInCart.js";
import trendingProducts from "./algorithms/trendingProducts.js";
import intervals from "./algorithms/intervals.js";
import mostPurchased from "./algorithms/mostPurchased.js";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import RejectedProducts from "../../models/RejectedProducts.js";
import Favorite from "../../models/Favorite.js";
import { filterAvailableProducts } from "./availableProducts.js";
import { fetchFeatures } from "./features.js";

function normalizeScores(products) {
  //classify the products by algo
  const classifyByAlgo = new Map();
  for (const [productId, data] of products.entries()) {
    const algo = data.algorithm;
    if (!classifyByAlgo.has(algo)) {
      classifyByAlgo.set(algo, []);
    }
    classifyByAlgo.get(algo).push({ productId, score: data.score });
  }

  //normalize the algorithm's scores: score_norm = (score - minScore) / (maxScore - minScore)
  for (const [algo, entries] of classifyByAlgo.entries()) {
    const scores = entries.map((e) => e.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);

    //avoid division by zero
    const range = max - min || 1;

    //set the normalize score
    for (const { productId, score } of entries) {
      const data = products.get(productId);
      products.set(productId, {
        ...data,
        scoreNormalized: (score - min) / range,
      });
    }
  }

  return products;
}

function cleanAddress(address) {
  address = address.trim();
  if (address.endsWith("ישראל")) {
    address = address.slice(0, address.length - "ישראל".length).trim();
  }
  return address.replace(/,+$/, "").trim();
}

async function getProducts(cartProductIdsSet, shoudNotSuggest, cartKey, times) {
  const [
    basedEveryProductResponse,
    trendingProductsResponse,
    intervalsResponse,
    mostPurchasedResponse,
  ] = await Promise.all([
    basedEveryProduct([...cartProductIdsSet], times),
    trendingProducts([...cartProductIdsSet], times),
    intervals([...cartProductIdsSet], cartKey, times),
    mostPurchased([...shoudNotSuggest], cartKey, times),
  ]);

  const all = [
    ...basedEveryProductResponse,
    ...trendingProductsResponse,
    ...intervalsResponse,
    ...mostPurchasedResponse,
  ];

  const filtered = all.filter(
    (item) => item?.productId && !shoudNotSuggest.has(item.productId.toString())
  );

  return filtered;
}

export async function suggestions(req, res) {
  const { cartKey, mail } = req.params;
  const k = 3;
  const MAX_ROUNDS = 4;

  try {
    const [cartProductIdsArr, rejectedProductsIdsArr, favorites] =
      await Promise.all([
        ProductInCart.find({ cartKey }).then((docs) =>
          docs.map((p) => p.productId.toString())
        ),
        RejectedProducts.find({ cartKey, rejectedBy: mail }).then((docs) => {
          const limit = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); //2 weeks
          return docs
            .filter((doc) => doc.createdAt >= limit)
            .map((p) => p.productId.toString());
        }),
        Favorite.find({ mail }).lean(),
      ]);

    const cartProductIdsSet = new Set(cartProductIdsArr);
    const rejectedProductsIdsSet = new Set(rejectedProductsIdsArr);
    const favoriteIds = new Set(
      favorites.map((fav) => fav.productId.toString())
    );

    const shoudNotSuggest = new Set([
      ...cartProductIdsSet,
      ...rejectedProductsIdsSet,
    ]);
    const collectedProducts = new Map();

    let round = 0;
    const availableProductEntries = new Map(); // productId -> productData

    const cart = await Cart.findById(cartKey);
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    const cartAddress = cleanAddress(cart.address);

    //make sure that suggest enough products
    while (round < MAX_ROUNDS && availableProductEntries.size < 6) {
      round++;
      //console.log(round);

      //get the products from the algorithms
      const newRecommendations = await getProducts(
        cartProductIdsSet,
        shoudNotSuggest,
        cartKey,
        Math.pow(k, round)
      );

      newRecommendations.forEach((rec) => {
        shoudNotSuggest.add(rec.productId.toString());
        collectedProducts.set(rec.productId.toString(), rec);
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
        const productData = collectedProducts.get(productId);
        const productDoc = products.find((p) => p._id.toString() === productId);

        if (
          productData &&
          productDoc &&
          !availableProductEntries.has(productId)
        ) {
          availableProductEntries.set(productId, {
            product: productDoc,
            storeCount,
            score: productData.score,
            algorithm: productData.algorithm,
            isFavorite: favoriteIds.has(productId),
          });
        }
      }
    }

    if (availableProductEntries.size === 0) return res.status(200).json([]);

    //normalize the algorithm's scores
    const normalizeScoresProductEntries = normalizeScores(
      availableProductEntries
    );

    //fetch the features of the products
    const features = await fetchFeatures(
      normalizeScoresProductEntries,
      cartKey,
      mail
    );
    /*
    for (const [productId, meta] of features.entries()) {
      console.log(
        `${productId} | score: ${meta.scoreNormalized} | algo: ${meta.algorithm} | stores: ${meta.storeCount} | fav: ${meta.isFavorite} | purchased: ${meta.purchasedBefore} | times: ${meta.timesPurchased} | recently: ${meta.recentlyPurchased} | rejectedByUser: ${meta.timesWasRejectedByUser} | rejectedByCart: ${meta.timesWasRejectedByCart}`
      );
    }
    */
    const response = [...availableProductEntries.values()].map((entry) => ({
      productId: entry.product._id.toString(),
      name: entry.product.name,
      image: entry.product.image,
      isFavorite: favoriteIds.has(entry.product._id.toString()),
    }));

    return res.status(200).json(response);
  } catch (err) {
    console.error("Recommendation error:", err.message);
    return res
      .status(500)
      .json({ message: "Error generating recommendations" });
  }
}

export default suggestions;
