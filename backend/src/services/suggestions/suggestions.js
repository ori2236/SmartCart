import basedEveryProduct from "./algorithms/basedEveryProduct.js"
import ProductInCart from "../../models/ProductInCart.js";

export async function suggestions(req, res) {
  const { cartKey } = req.params;
  try {
    const cartProducts = await ProductInCart.find({ cartKey });
    const cartProductIds = cartProducts.map((p) => p.productId);

    const algoResult = await basedEveryProduct(cartProductIds, 5);

    return res.status(200).json(algoResult);

  } catch (err) {
    console.error("Recommendation error:", err.message);
    return res
      .status(500)
      .json({ message: "Error generating recommendations" });
  }
}

export default suggestions;
