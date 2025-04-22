import basedEveryProduct from "./algorithms/basedEveryProduct.js";
import ProductInCart from "../../models/ProductInCart.js";
import trendingProducts from "./algorithms/trendingProducts.js";
import intervals from "./algorithms/intervals.js";
import mostPurchased from "./algorithms/mostPurchased.js";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import RejectedProducts from "../../models/RejectedProducts.js";
import { filterAvailableProducts } from "./availableProducts.js";

function cleanAddress(address) {
  address = address.trim();
  if (address.endsWith("ישראל")) {
    address = address.slice(0, address.length - "ישראל".length).trim();
  }
  return address.replace(/,+$/, "").trim();
}

async function getProducts(
  cartProductIds,
  rejectedProductsIds,
  cartKey,
  times
) {
  const [
    basedEveryProductResponse,
    trendingProductsResponse,
    intervalsResponse,
    mostPurchasedResponse,
  ] =
    // same time
    await Promise.all([
      (async () => {
        return basedEveryProduct(cartProductIds, times);
      })(),
      (async () => {
        return trendingProducts(cartProductIds, times);
      })(),
      (async () => {
        return intervals(cartProductIds, cartKey, times);
      })(),
      (async () => {
        return mostPurchased(cartProductIds, cartKey, times);
      })(),
    ]);

    return [
      ...basedEveryProductResponse,
      ...trendingProductsResponse,
      ...intervalsResponse,
      ...mostPurchasedResponse,
    ]
      .map((p) => p?.productId?.toString())
      .filter(Boolean) //not null
      .filter(
        (id) =>
          !cartProductIds.includes(id) && !rejectedProductsIds.includes(id)
      );
}

export async function suggestions(req, res) {
  const { cartKey, mail } = req.params;
  const rejectedBy = mail;
  const k = 10;
  try {
    const [cartProductIds, rejectedProductsIds] =
      // same time
      await Promise.all([
        (async () => {
          const cartProducts = await ProductInCart.find({ cartKey });
          return cartProducts.map((p) => p.productId.toString());
        })(),
        (async () => {
          const rejectedProducts = await RejectedProducts.find({
            cartKey,
            rejectedBy,
          });
          return rejectedProducts.map((p) => p.productId.toString());
        })(),
      ]);

    let allProductIds = await getProducts(
      cartProductIds,
      rejectedProductsIds,
      cartKey,
      k
    );
    let uniqueIds = Array.from(new Set(allProductIds));

    if (uniqueIds.length < k) {
      const moreProductIds = await getProducts(
        cartProductIds,
        rejectedProductsIds,
        cartKey,
        2 * k
      );
      uniqueIds = Array.from(new Set([...uniqueIds, ...moreProductIds]));
    }

    if (uniqueIds.length === 0) return res.status(200).json([]);
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


    const log = finalProducts.map((p) => ({
      productId: p._id.toString(),
      name: p.name,
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
