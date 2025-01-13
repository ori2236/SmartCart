import Favorite from "../../models/Favorite.js";
import Product from "../../models/Product.js";
import User from "../../models/User.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { productId, mail } = req.body;

      if (!productId || !mail) {
        return res
          .status(400)
          .json({ error: "productId and mail are required." });
      }

      try {
        const productExists = await Product.findById(productId);
        if (!productExists) {
          return res.status(404).json({ error: "Product not found." });
        }

        const userExists = await User.findOne({ mail });
        if (!userExists) {
          return res.status(404).json({ error: "User not found." });
        }

        const existingFavorite = await Favorite.findOne({ productId, mail });
        if (existingFavorite) {
          return res.status(400).json({
            error: "This product is already in the user's favorites.",
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          message: "Error validating product or user existence.",
          error: error.message,
        });
      }
    },
    handler: async (req, res) => {
      const { productId, mail } = req.body;

      try {
        const newFavorite = await Favorite.create({ productId, mail });

        res.status(201).json({
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
  handler: async (req, res) => {
    const { productId, mail } = req.body;

    try {
      const existingFavorite = await Favorite.findOne({ productId, mail });

      if (existingFavorite) {
        return res.status(400).json({
          error: "This product is already in the user's favorites.",
        });
      }

      const newFavorite = await Favorite.create({ productId, mail });

      res.status(201).json({
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
  get: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      const { type, content } = req.params;

      try {
        if (type === "mail") {
          // חפש את כל המועדפים של המשתמש לפי המייל
          const favorites = await Favorite.find({ mail: content });

          if (!favorites || favorites.length === 0) {
            return res.status(404).json({
              error: "No favorites found for the provided mail.",
            });
          }

          // שלוף את כל הפריטים מטבלת Product
          const productIds = favorites.map((fav) => fav.productId);
          const products = await Product.find({ _id: { $in: productIds } });

          return res.status(200).json(products);
        } else if (type === "productId") {
          // מצא את כל המועדפים הקשורים למוצר מסוים
          const favorites = await Favorite.find({ productId: content });

          if (!favorites || favorites.length === 0) {
            return res.status(404).json({
              error: "No favorites found for the provided productId.",
            });
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
  delete: {
    validator: async (req, res, next) => {
      const { productId, mail } = req.params;

      if (!productId || !mail) {
        return res.status(400).json({
          error: "Both 'productId' and 'mail' are required.",
        });
      }

      next();
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

        res.status(200).json({
          message: "Favorite deleted successfully.",
        });
      } catch (error) {
        res.status(500).json({
          error: "An error occurred while deleting the favorite.",
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
