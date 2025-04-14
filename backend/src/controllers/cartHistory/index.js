import ProductInCart from "../../models/ProductInCart.js";
import CartHistory from "../../models/CartHistory.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { cartKey, productId } = req.body;

      if (!cartKey || !productId) {
        return res.status(400).json({
          error:
            "cartKey and productId are required.",
        });
      }

      next();
    },
    handler: async (req, res) => {
      const { cartKey, productId } = req.body;
      
      try {
        const existingProductInCart = await ProductInCart.findOne({
          cartKey,
          productId,
        });
        if (!existingProductInCart) {
          return res.status(400).json({
            message: "This product is not in the cart.",
          });
        }

        const deleteProductInCart = await ProductInCart.deleteOne({
          cartKey,
          productId,
        });

        const newInCartHistory = await CartHistory.create({
          cartKey,
          productId,
          quantity: existingProductInCart.quantity,
        });


        res.status(201).json({
          message: "Product added to cart history successfully.",
          product: newInCartHistory
        });
      } catch (error) {
        res.status(500).json({
          message: "Error adding product to cart.",
          error: error.message,
        });
      }
    },
  },
};
