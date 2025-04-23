import RejectedProducts from "../../models/RejectedProducts.js";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import User from "../../models/User.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { cartKey, productId, mail } = req.body;
      if (!cartKey || !productId || !mail) {
        return res.status(400).json({
          error: "cartKey, productId, and mail are required.",
        });
      }

      try {
        const productExists = await Product.findById(productId);
        if (!productExists) {
          return res.status(404).json({ error: "Product not found." });
        }

        const cartExists = await Cart.findById(cartKey);
        if (!cartExists) {
          return res.status(404).json({ error: "Cart not found." });
        }

        const user = await User.findOne({ mail });
        if (!user) {
          return res.status(404).json({ error: "User not found." });
        }

        next();
      } catch (error) {
        res.status(500).json({
          error: "An error occurred during validation.",
          details: error.message,
        });
      }
    },
    handler: async (req, res) => {
      const { cartKey, productId, mail } = req.body;

      try {
        const rejectedProd = await RejectedProducts.findOne({
          cartKey,
          productId,
          rejectedBy: mail,
        });

        if (rejectedProd) {
          return res.status(409).json({
            error: "This product is already marked as rejected by this user.",
          });
        }
          
        const rejected = await RejectedProducts.create({
          cartKey,
          productId,
          rejectedBy: mail,
        });

        res.status(201).json({
          message: "Product rejected successfully.",
          rejected,
        });
      } catch (error) {
        res.status(500).json({
          error: "An error occurred while rejecting the product.",
          details: error.message,
        });
      }
    },
  },

  delete: {
    validator: async (req, res, next) => {
      const { cartKey, productId, mail } = req.params;

      if (!cartKey || !productId || !mail) {
        return res.status(400).json({
          error: "cartKey, productId, and mail are required.",
        });
      }

      next();
    },

    handler: async (req, res) => {
      const { cartKey, productId, mail } = req.params;

      try {
        const rejectedProd = await RejectedProducts.findOneAndDelete({
          cartKey,
          productId,
          rejectedBy: mail,
        });

        if (!rejectedProd) {
          return res.status(409).json({
            error: "This product is not marked as rejected by this user.",
          });
        }


        res
          .status(200)
          .json({ message: "Rejected product removed successfully." });
      } catch (error) {
        res.status(500).json({
          error: "An error occurred while deleting the rejected product.",
          details: error.message,
        });
      }
    },
  },
};
