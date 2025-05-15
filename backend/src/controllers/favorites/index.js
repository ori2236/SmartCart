import { emitFavoritesUpdate } from "../../socket.js";
import Favorite from "../../models/Favorite.js";
import Product from "../../models/Product.js";
import ProductInCart from "../../models/ProductInCart.js";
import User from "../../models/User.js";
import ProductController from "../products/index.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { productId, mail } = req.body;

      if (!productId || !mail) {
        return res
          .status(400)
          .json({ error: "productId and mail are required." });
      }
      next();
    },
    handler: async (req, res) => {
      const { productId, mail } = req.body;

      try {
        const existingFavorite = await Favorite.findOne({ productId, mail });

        if (existingFavorite) {
          return res.status(200).json({
            message: "This product is already in the user's favorites.",
          });
        }
        const newFavorite = await Favorite.create({ productId, mail });
        const product = await Product.findById(productId);

        emitFavoritesUpdate(mail, {
          type: "add",
          product: {
            productId: productId,
            name: product.name,
            image: product.image,
            quantity: 1,
          },
        });
        
        return res.status(201).json({
          message: "Product added to favorites successfully.",
          favorite: newFavorite,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error adding product to favorites.",
          error: error.message,
        });
      }
    },
  },
  get: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      const { mail, cartKey } = req.params;

      try {
        const [favorites, cartProducts] = await Promise.all([
          Favorite.find({ mail }),
          ProductInCart.find({ cartKey }),
        ]);

        if (favorites.length === 0) {
          return res.status(200).json([]);
        }

        const productIds = favorites.map((fav) => fav.productId);

        const products = await Product.find({
          _id: { $in: productIds },
        });

        const productMap = new Map(
          products.map((prod) => [prod._id.toString(), prod])
        );
        const cartProductMap = new Map(
          cartProducts.map((p) => [p.productId, p])
        );

        const response = favorites.map((fav) => {
          const product = productMap.get(fav.productId);
          return {
            productId: fav.productId.toString(),
            name: product?.name || "Unknown",
            image: product?.image || null,
            quantityInFavorites: fav.quantity,
            isInCart: cartProductMap.has(fav.productId.toString()),
            quantityInCart:
              cartProductMap.get(fav.productId.toString())?.quantity || 0,
          };
        });

        return res.status(200).json(response);
      } catch (error) {
        res.status(500).json({
          error: "An error occurred while processing your request.",
          details: error.message,
        });
      }
    },
  },
  put: {
    validator: async (req, res, next) => {
      const { productId, mail } = req.params;
      const { quantity } = req.body;

      if (!productId || !mail || quantity === undefined) {
        return res
          .status(400)
          .json({ error: "productId, mail, and quantity are required." });
      }

      next();
    },
    handler: async (req, res) => {
      const { productId, mail } = req.params;
      const { quantity } = req.body;

      try {
        const updatedProductInFavs = await Favorite.findOneAndUpdate(
          { productId, mail },
          { quantity },
          { new: true, runValidators: true }
        );

        if (!updatedProductInFavs) {
          return res
            .status(404)
            .json({ error: "Product not found in favorites." });
        }

        emitFavoritesUpdate(mail, {
          type: "update",
          productId,
          quantity,
        });

        res.status(200).json({
          message: "Product quantity updated successfully in favorites.",
          favorite: updatedProductInFavs,
        });
      } catch (error) {
        console.error("Error updating product in favorites:", error.message);
        res.status(500).json({
          error: "An error occurred while updating the product in favorites.",
        });
      }
    },
  },
  delete: {
    validator: async (req, res, next) => {
      const { productId, mail } = req.body;
      if (!productId || !mail) {
        return res.status(400).json({
          error: "Both 'productId' and 'mail' are required.",
        });
      }

      next();
    },
    handler: async (req, res) => {
      const { productId, mail } = req.body;

      try {
        const deletedFavorite = await Favorite.findOneAndDelete({
          productId,
          mail,
        });

        if (!deletedFavorite) {
          return res.status(404).json({
            error: "No favorite found for the provided productId and mail.",
          });
        }

        emitFavoritesUpdate(mail, {
          type: "remove",
          productId,
        });

        res.status(200).json({
          message: "Favorite deleted successfully.",
        });
      } catch (error) {
        res.status(500).json({
          error: "An error occurred while deleting the favorite.",
          details: error.message,
        });
      }
    },
  },
};
