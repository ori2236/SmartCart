import basedEveryProduct from "./algorithms/basedEveryProduct.js";
import ProductInCart from "../../models/ProductInCart.js";
import trendingProducts from "./algorithms/trendingProducts.js";
import intervals from "./algorithms/intervals.js";
import mostPurchased from "./algorithms/mostPurchased.js";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import { filterAvailableProducts } from "./availableProducts.js";

function cleanAddress(address) {
  address = address.trim();
  if (address.endsWith("ישראל")) {
    address = address.slice(0, -"ישראל".length).trim();
  }
  return address.replace(/,+$/, "").trim();
}

export async function suggestions(req, res) {
  const { cartKey } = req.params;
  const k = 10;
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
          return basedEveryProduct(cartProductIds, k);
        })(),
        (async () => {
          return trendingProducts(cartProductIds, k);
        })(),
        (async () => {
          return intervals(cartProductIds, cartKey, k);
        })(),
        (async () => {
          return mostPurchased(cartProductIds, cartKey, k);
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

    const cart = await Cart.findById(cartKey);
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartAddress = cleanAddress(cart.address);

    const finalAvailableProductIds = await filterAvailableProducts(
      products,
      cartAddress
    );

    const finalProducts = products.filter((p) =>
      finalAvailableProductIds.includes(p._id.toString())
    );
    const response = finalProducts.map((p) => ({
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