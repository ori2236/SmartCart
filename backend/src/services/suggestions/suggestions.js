import basedEveryProduct from "./algorithms/basedEveryProduct.js";
import ProductInCart from "../../models/ProductInCart.js";
import trendingProducts from "./algorithms/trendingProducts.js";
import intervals from "./algorithms/intervals.js";
import mostPurchased from "./algorithms/mostPurchased.js";

export async function suggestions(req, res) {
  const { cartKey } = req.params;
  try {
    const cartProducts = await ProductInCart.find({ cartKey });
    const cartProductIds = cartProducts.map((p) => p.productId);

    const [
      basedEveryProductResponse,
      trendingProductsResponse,
      intervalsResponse,
      mostPurchasedResponse,
    ] =
      // same time
      await Promise.all([
        (async () => {
          return basedEveryProduct(cartProductIds, 5);
        })(),
        (async () => {
          return trendingProducts(cartProductIds, 5);
        })(),
        (async () => {
          return intervals(cartProductIds, cartKey, 5);
        })(),
        (async () => {
          return mostPurchased(cartProductIds, cartKey, 5);
        })(),
      ]);

    const response = [
      ...basedEveryProductResponse,
      ...trendingProductsResponse,
      ...intervalsResponse,
      ...mostPurchasedResponse,
    ];

    return res.status(200).json(response);
  } catch (err) {
    console.error("Recommendation error:", err.message);
    return res
      .status(500)
      .json({ message: "Error generating recommendations" });
  }
}

export default suggestions;
