import CartHistory from "../../../models/CartHistory.js";

export async function intervals(cartProductIds, cartKey, k = 5) {
  const today = new Date();

  const grouped = await CartHistory.aggregate([
    { $match: { cartKey } },
    {
      $group: {
        _id: "$productId",
        count: { $sum: 1 },
        dates: { $push: "$date" },
      },
    },
    { $match: { count: { $gte: 2 } } },
  ]);

  const tasks = grouped.map(async (item) => {
    const productId = item._id;
    if (cartProductIds.includes(productId)) {
      return null;
    }
    const dates = item.dates.map((d) => new Date(d)).sort((a, b) => a - b);

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const diffDays = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
      intervals.push(diffDays);
    }

    const avgInterval =
      intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const lastPurchaseDate = dates[dates.length - 1];
    const daysSinceLastPurchase =
      (today - lastPurchaseDate) / (1000 * 60 * 60 * 24);

    const shouldRecommend =
      daysSinceLastPurchase >= avgInterval * 0.8 &&
      daysSinceLastPurchase <= avgInterval * 1.5;

    if (shouldRecommend) {
      /*
      console.log({
        productId,
        avgInterval: avgInterval.toFixed(1),
        lastPurchaseDate: lastPurchaseDate.toISOString().split("T")[0],
        daysSinceLastPurchase: daysSinceLastPurchase.toFixed(1),
        count: dates.length,
      });
      */

      return {
        productId,
        score: dates.length,
      };
    }

    return null;
  });

  const results = await Promise.all(tasks);
  const recommendations = results.filter((r) => r !== null);

  return recommendations.sort((a, b) => b.score - a.score).slice(0, k);
}

export default intervals;
