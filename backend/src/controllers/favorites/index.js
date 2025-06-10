import { emitFavoritesUpdate } from "../../socket.js";
import Favorite from "../../models/Favorite.js";
import Product from "../../models/Product.js";
import ProductInCart from "../../models/ProductInCart.js";
import Cart from "../../models/Cart.js";
import { cleanAddress } from "../../services/suggestions/suggestions.js";
import { filterAvailableProducts } from "../../services/suggestions/availableProducts.js";

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
      const { mail, cartKey } = req.params;
      if (!mail || !cartKey) {
        return res
          .status(400)
          .json({ error: "mail and cartKey are required." });
      }
      next();
    },
    handler: async (req, res) => {
      const { mail, cartKey } = req.params;

      try {
        const [favorites, cartProducts, cart] = await Promise.all([
          Favorite.find({ mail }),
          ProductInCart.find({ cartKey }),
          Cart.findById(cartKey),
        ]);

        if (!cart) {
          return res.status(404).json({ error: "Cart not found." });
        }

        if (favorites.length === 0) {
          return res.status(200).json([]);
        }

        const productIds = favorites.map((fav) => fav.productId);

        const products = await Product.find({
          _id: { $in: productIds },
        });

        const cartAddress = cleanAddress(cart.address);
        const availableEntries = await filterAvailableProducts(
          products,
          cartAddress
        );
        const availableSet = new Set(availableEntries.map(([id, count]) => id));

        const productMap = new Map(
          products.map((prod) => [prod._id.toString(), prod])
        );
        const cartProductMap = new Map(
          cartProducts.map((p) => [p.productId, p])
        );

        const response = favorites
          .map((fav) => {
            const pid = fav.productId.toString();
            const prod = productMap.get(pid) || {};
            return {
              productId: pid,
              name: prod.name || "Unknown",
              image: prod.image || null,
              quantityInFavorites: fav.quantity,
              isInCart: cartProductMap.has(pid),
              quantityInCart: cartProductMap.get(pid)?.quantity || 0,
            };
          })
          .filter((item) => availableSet.has(item.productId));

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
