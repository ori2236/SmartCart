import { emitCartUpdate } from "../../socket.js";
import ProductInCart from "../../models/ProductInCart.js";
import CartHistory from "../../models/CartHistory.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { cartKey, productId } = req.body;
      if (!cartKey || !productId) {
        return res.status(400).json({
          error: "cartKey and productId are required.",
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
        const deletedProductInCart = await ProductInCart.findOneAndDelete({
          cartKey,
          productId,
        });

        if (!deletedProductInCart) {
          return res.status(404).json({ error: "Product not found in cart." });
        }
        emitCartUpdate(cartKey, {
          type: "remove",
          productId,
        });

        const newInCartHistory = await CartHistory.create({
          cartKey,
          productId,
          quantity: existingProductInCart.quantity,
        });

        res.status(201).json({
          message: "Product added to cart history successfully.",
          product: newInCartHistory,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error adding product to cart.",
          error: error.message,
        });
      }
    },
  },
  delete: {
    validator: async (req, res, next) => {
      const { cartKey, productId, quantity, mail } = req.body;

      if (!cartKey || !productId || quantity === undefined || !mail) {
        return res.status(400).json({
          error: "cartKey, productId, quantity, and mail are required.",
        });
      }

      next();
    },

    handler: async (req, res) => {
      const { cartKey, productId, quantity, mail } = req.body;

      try {
        const user = await User.findOne({ mail });
        if (!user) {
          return res.status(404).json({
            error: "User with provided mail not found.",
          });
        }
        const nickname = user.nickname;

        const deletedFromHistory = await CartHistory.findOneAndDelete({
          cartKey,
          productId,
        });

        if (!deletedFromHistory) {
          return res.status(404).json({
            message: "Product not found in cart history.",
          });
        }

        const existingInCart = await ProductInCart.findOne({
          cartKey,
          productId,
        });
        if (existingInCart) {
          return res.status(400).json({
            message: "Product already exists in cart.",
          });
        }

        const newProductInCart = await ProductInCart.create({
          cartKey,
          productId,
          quantity,
          updatedBy: nickname,
        });

        const product = await Product.findById(productId);

        emitCartUpdate(cartKey, {
          type: "add",
          product: {
            productId,
            quantity,
            name: product?.name || "",
            image: product?.image || "",
            updatedBy: nickname,
          },
        });

        res.status(200).json({
          message: "Product returned from history to cart.",
          productInCart: newProductInCart,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error returning product to cart.",
          error: error.message,
        });
      }
    },
  },
};
