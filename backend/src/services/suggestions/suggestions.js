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
  cartProductIdsSet,
  rejectedProductsIdsSet,
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
    mostPurchased([...cartProductIdsSet], cartKey, times),
  ]);

  return Array.from(
    new Set(
      [
        ...basedEveryProductResponse,
        ...trendingProductsResponse,
        ...intervalsResponse,
        ...mostPurchasedResponse,
      ]
        .map((p) => p?.productId?.toString())
        .filter(Boolean)
        .filter(
          (id) => !cartProductIdsSet.has(id) && !rejectedProductsIdsSet.has(id)
        )
    )
  );
}

export async function suggestions(req, res) {
  const { cartKey, mail } = req.params;
  const rejectedBy = mail;
  const k = 10;
  try {
    const [cartProductIdsArr, rejectedProductsIdsArr] = await Promise.all([
      ProductInCart.find({ cartKey }).then((docs) =>
        docs.map((p) => p.productId.toString())
      ),
      RejectedProducts.find({ cartKey, rejectedBy: mail }).then((docs) =>
        docs.map((p) => p.productId.toString())
      ),
    ]);

    const cartProductIdsSet = new Set(cartProductIdsArr);
    const rejectedProductsIdsSet = new Set(rejectedProductsIdsArr);

    let allProductIds = await getProducts(
      cartProductIdsSet,
      rejectedProductsIdsSet,
      cartKey,
      k
    );

    if (allProductIds.length < k) {
      const moreProductIds = await getProducts(
        new Set([...cartProductIdsSet, ...allProductIds]),
        rejectedProductsIdsSet,
        cartKey,
        2 * k
      );
      allProductIds = [...allProductIds, ...moreProductIds];
    }

    if (allProductIds.length === 0) return res.status(200).json([]);
    
    const [products, cart] = await Promise.all([
      Product.find({ _id: { $in: allProductIds } }),
      Cart.findById(cartKey),
    ]);

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartAddress = cleanAddress(cart.address);

    const finalAvailableProductIds = await filterAvailableProducts(
      products,
      cartAddress
    );

    const availableSet = new Set(finalAvailableProductIds);
    const finalProducts = products.filter((p) =>
      availableSet.has(p._id.toString())
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
