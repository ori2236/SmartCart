import basedEveryProduct from "./algorithms/basedEveryProduct.js";
import ProductInCart from "../../models/ProductInCart.js";
import trendingProducts from "./algorithms/trendingProducts.js";
import intervals from "./algorithms/intervals.js";
import mostPurchased from "./algorithms/mostPurchased.js";
import Product from "../../models/Product.js";

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

    const allProductIds = [
      ...basedEveryProductResponse,
      ...trendingProductsResponse,
      ...intervalsResponse,
      ...mostPurchasedResponse,
    ]
      .map((p) => p.productId)
      .filter(Boolean) // not null
      .filter((id) => !cartProductIds.includes(id));

    const uniqueIds = Array.from(new Set(allProductIds));
    const products = await Product.find({ _id: { $in: uniqueIds } });

    const response = products.map((p) => ({
      productId: p._id.toString(),
      name: p.name,
      image: p.image,
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
