import CartHistory from "../../../models/CartHistory.js";
import ProductRecommendation from "../../../models/ProductRecommendation.js";

//returns up to 3 purchase dates from the given referenceDate onward
const dateCache = new Map();
async function getNextPurchaseDates(cartKey, referenceDate) {
  if (!dateCache.has(cartKey)) {
    const dates = await CartHistory.find({ cartKey }).distinct("date");
    const sorted = dates.map((d) => new Date(d)).sort((a, b) => a - b);
    dateCache.set(cartKey, sorted);
  }

  const sorted = dateCache.get(cartKey);
  const idx = sorted.findIndex((d) => d >= new Date(referenceDate));
  return sorted.slice(idx, idx + 3);
}

//weighted score of products that appeared after the given product
export async function getScoresForProducts(productId) {
  const fromDatabase = await ProductRecommendation.findOne({
    sourceProductId: productId,
  });
  if (fromDatabase) {
    const map = new Map();
    fromDatabase.recommendations.forEach(({ productId, score }) =>
      map.set(productId, score)
    );
    return map;
  }

  const occurrences = await CartHistory.find({ productId });

  const scoreMap = new Map();

  //full cart history sorted by date
  const cartKeys = [...new Set(occurrences.map((o) => o.cartKey))];
  const fullHistories = await CartHistory.find({
    cartKey: { $in: cartKeys },
  }).sort({ cartKey: 1, date: 1 });

  const cartHistories = {};
  for (const entry of fullHistories) {
    if (!cartHistories[entry.cartKey]) cartHistories[entry.cartKey] = [];
    cartHistories[entry.cartKey].push(entry);
  }

  //occurrences of productId in carts
  const occurMap = {};
  for (const occ of occurrences) {
    if (!occurMap[occ.cartKey]) occurMap[occ.cartKey] = [];
    occurMap[occ.cartKey].push(occ);
  }

  const WEIGHTS = [1, 0.7, 0.4];
  for (const cartKey of cartKeys) {
    const fullHistory = cartHistories[cartKey] || [];

    //products on each date
    const historyByDate = {};
    for (const entry of fullHistory) {
      const key = new Date(entry.date).toISOString().split("T")[0];
      if (!historyByDate[key]) historyByDate[key] = [];
      historyByDate[key].push(entry.productId);
    }

    //set scores
    for (const occ of occurMap[cartKey]) {
      const dates = await getNextPurchaseDates(cartKey, occ.date);
      for (let i = 0; i < dates.length; i++) {
        const key = new Date(dates[i]).toISOString().split("T")[0];
        const products = historyByDate[key] || [];
        for (const p of products) {
          if (p === productId) continue;
          const current = scoreMap.get(p) || 0;
          scoreMap.set(p, current + WEIGHTS[i]);
        }
      }
    }
  }

  const recommendations = [...scoreMap.entries()].map(([productId, score]) => ({
    productId,
    score,
  }));

  await ProductRecommendation.create({
    sourceProductId: productId,
    recommendations,
  });

  return scoreMap;
}

//returns top K recommended products for a cartKey
export async function basedEveryProduct(cartProductIds, K) {
  try {
    if (cartProductIds.length === 0) {
      return [];
    }

    const productIdSet = new Set(cartProductIds);
    const totalScores = new Map();

    const productScoreMaps = await Promise.all(
      cartProductIds.map((pid) => getScoresForProducts(pid))
    );

    for (let i = 0; i < cartProductIds.length; i++) {
      const productScores = productScoreMaps[i];

      for (const [p, score] of productScores.entries()) {
        if (productIdSet.has(p)) continue;
        const existing = totalScores.get(p) || 0;
        totalScores.set(p, existing + score);
      }
    }

    //sort and return top k products with the highest scores
    const scores = [...totalScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, K);

    return scores.map(([productId, score]) => ({
      productId,
      score,
      algorithm: 0,
    }));
  } catch (err) {
    console.error("Recommendation error:", err.message);
    return [];
  }
}

export default basedEveryProduct;
