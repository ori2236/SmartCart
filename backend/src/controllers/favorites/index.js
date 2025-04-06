import { emitFavoritesUpdate } from "../../socket.js";
import Favorite from "../../models/Favorite.js";
import Product from "../../models/Product.js";
import ProductInCart from "../../models/ProductInCart.js";
import User from "../../models/User.js";
import ProductController from "../products/index.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { name, image, mail } = req.body;
      if (!name || !image || !mail) {
        return res
          .status(400)
          .json({ error: "name, image, and mail are required." });
      }
      next();
    },
    handler: async (req, res) => {
      const { name, image, mail } = req.body;
      let productId = "";

      try {
        let product = await Product.findOne({ name, image });
        if (!product) {
          const reqMock = {
            body: {
              name: name,
              image: image,
            },
          };
          const resMock = {
            data: null,
            json: function (response) {
              this.data = response;
              return response;
            },
            status: function (statusCode) {
              return this;
            },
          };

          const createdProduct = await ProductController.post.handler(
            reqMock,
            resMock
          );
          product = resMock.data.product;
        }

        productId = product._id.toString();
        const existingFavorite = await Favorite.findOne({ productId, mail });

        if (existingFavorite) {
          return res.status(200).json({
            message: "This product is already in the user's favorites.",
          });
        }
        const newFavorite = await Favorite.create({ productId, mail });

        emitFavoritesUpdate(mail, {
          type: "add",
          product: {
            productId: productId,
            name,
            image,
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
      const { type, content } = req.params;

      try {
        if (type === "mail") {
          const favorites = await Favorite.find({ mail: content });

          if (!favorites) {
            return res.status(404).json({
              error: "No favorites found for the provided mail.",
            });
          }
          if (favorites.length === 0) {
            const products = [];
            return res.status(200).json(products);
          }

          const productIds = favorites.map((fav) => fav.productId);
          const products = await Product.find({ _id: { $in: productIds } });

          const response = favorites.map((fav) => {
            const product = products.find(
              (prod) => prod._id.toString() === fav.productId
            );
            return {
              _id: fav.productId,
              name: product?.name || "Unknown",
              image: product?.image || null,
              quantity: fav.quantity,
            };
          });

          return res.status(200).json(response);
        } else if (type === "productId") {
          const favorites = await Favorite.find({ productId: content });

          if (!favorites) {
            return res.status(404).json({
              error: "No favorites found for the provided productId.",
            });
          }
          if (favorites.length === 0) {
            const products = [];
            return res.status(200).json(products);
          }

          return res.status(200).json(favorites);
        } else {
          return res
            .status(400)
            .json({ error: "Invalid type. Use 'mail' or 'productId'." });
        }
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
      const { productId, mail } = req.params;

      if (!productId || !mail) {
        return res.status(400).json({
          error: "Both 'productId' and 'mail' are required.",
        });
      }

      try {
        const productExists = await Product.findById(productId);
        if (!productExists) {
          return res.status(404).json({
            error: "Product not found.",
          });
        }

        const userExists = await User.findOne({ mail });
        if (!userExists) {
          return res.status(404).json({
            error: "No user found for the provided mail.",
          });
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
      const { productId, mail } = req.params;

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
          productDeleted: remainingFavorites.length === 0,
        });
      } catch (error) {
        res.status(500).json({
          error: "An error occurred while deleting the favorite.",
          details: error.message,
        });
      }
    },
  },
  deleteByDetails: {
    validator: async (req, res, next) => {
      const { name, image, mail } = req.body;
      if (!name || !image || !mail) {
        return res.status(400).json({
          error: "name, image, and mail are required.",
        });
      }
      try {
        const product = await Product.findOne({ name, image });
        if (!product) {
          return res.status(404).json({
            error: "Product not found with the provided name and image.",
          });
        }
        const productId = product._id.toString();
        req.params.productId = productId;
        req.params.mail = mail;

        next();
      } catch (error) {
        res.status(500).json({
          error: "An error occurred while validating the product details.",
          details: error.message,
        });
      }
    },
    handler: async (req, res, next) => {
      const { productId, mail } = req.params;
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
        const prodInFavs = await Favorite.findOne({ productId });
        const prodInCarts = await ProductInCart.findOne({ productId });
        if (!prodInFavs && !prodInCarts) {
          await Product.findByIdAndDelete(productId);
        }
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
  getAll: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      try {
        const favorites = await Favorite.find({});

        if (!favorites || favorites.length === 0) {
          return res.status(404).json({
            error: "No favorites found.",
          });
        }

        res.status(200).json(favorites);
      } catch (error) {
        res.status(500).json({
          error: "An error occurred while fetching all favorites.",
        });
      }
    },
  },
};
