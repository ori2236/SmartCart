import CartHistory from "../../../models/CartHistory.js";

async function mostPurchasedByTimes(cartProductIds, cartKey, k) {
  const grouped = await CartHistory.aggregate([
    {
      $match: {
        cartKey,
        productId: { $nin: cartProductIds }, //not in
      },
    },
    {
      $group: {
        _id: "$productId",
        score: { $sum: 1 },
      },
    },
    {
      $sort: { score: -1 }, //top to bottom
    },
    {
      $limit: k, //best k products
    },
  ]);

  const finalResults = grouped.map(({ _id, score }) => {
    const id = _id.toString();
    return {
      productId: id,
      score,
      algorithm: 3,
    };
  });

  return finalResults;
}

async function mostPurchasedByQuantity(cartProductIds, cartKey, k) {
  const grouped = await CartHistory.aggregate([
    {
      $match: {
        cartKey,
        productId: { $nin: cartProductIds }, //not in
      },
    },
    {
      $group: {
        _id: "$productId",
        score: { $sum: "$quantity" },
      },
    },
    {
      $sort: { score: -1 }, //top to bottom
    },
    {
      $limit: k, //best k products
    },
  ]);

  const finalResults = grouped.map(({ _id, score }) => {
    const id = _id.toString();
    return {
      productId: id,
      score,
      algorithm: 4,
    };

  });

  return finalResults;
}

export async function mostPurchased(cartProductIds, cartKey, K) {
  const [mostPurchasedByTimesResponse, mostPurchasedByQuantityResponse] =
    // same time
    await Promise.all([
      (async () => {
        return mostPurchasedByTimes(cartProductIds, cartKey, K);
      })(),
      (async () => {
        return mostPurchasedByQuantity(cartProductIds, cartKey, K);
      })(),
    ]);

  const map = new Map();

  for (const item of [
    ...mostPurchasedByTimesResponse,
    ...mostPurchasedByQuantityResponse,
  ]) {
    if (!map.has(item.productId)) {
      map.set(item.productId, item);
    }
  }

  const uniqueResults = Array.from(map.values());

  return uniqueResults;
}

export default mostPurchased;
