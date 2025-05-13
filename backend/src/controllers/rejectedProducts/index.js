import RejectedProducts from "../../models/RejectedProducts.js";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import User from "../../models/User.js";
import TrainingExample from "../../models/TrainingExample.js";
import { fetchAllFeatures } from "../../services/suggestions/features.js";

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
        const [product, cart, user] = await Promise.all([
          Product.findById(productId).lean(),
          Cart.findById(cartKey).lean(),
          User.findOne({ mail }).lean(),
        ]);

        if (!product)
          return res.status(404).json({ error: "Product not found." });
        if (!cart) return res.status(404).json({ error: "Cart not found." });
        if (!user) return res.status(404).json({ error: "User not found." });

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

        (async () => {
          try {
            const features = await fetchAllFeatures(productId, cartKey, mail);
            const feat = features.get(productId.toString()) || {};

            const featuresArray = [
              1,
              feat.isFavorite ?? 0,
              feat.purchasedBefore ?? 0,
              feat.timesPurchased ?? 0,
              feat.recentlyPurchased ?? 0,
              feat.storeCount ?? 0,
              feat.timesWasRejectedByCart ?? 0,
              feat.timesWasRejectedByUser ?? 0,
            ];

            const label = 0;

            await TrainingExample.create({
              productId,
              features: featuresArray,
              label,
            });
          } catch (err) {
            console.error("training‐example failed:", err);
          }
        })();
        
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

        await TrainingExample.deleteOne({
          productId,
          label: 0,
        });

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
