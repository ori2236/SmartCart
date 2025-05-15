import { emitCartUpdate } from "../../socket.js";
import ProductInCart from "../../models/ProductInCart.js";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import User from "../../models/User.js";
import TrainingExample from "../../models/TrainingExample.js";
import { fetchAllFeatures } from "../../services/suggestions/features.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { productId, cartKey, quantity, mail, explaination } = req.body;
      if (!productId || !cartKey || quantity === undefined || !mail) {
        return res.status(400).json({
          error: "productId, cartKey, quantity and mail are required.",
        });
      }

      next();
    },
    handler: async (req, res) => {
      const {
        productId,
        cartKey,
        quantity,
        mail,
        explaination = null,
      } = req.body;
      try {
        const existingProductInCart = await ProductInCart.findOne({
          cartKey,
          productId,
        });
        if (existingProductInCart) {
          return res.status(400).json({
            message: "This product is already in the cart.",
            productId: existingProductInCart.productId,
          });
        }
        const user = await User.findOne({ mail });
        const updatedBy = user.nickname;
        const newProductInCart = await ProductInCart.create({
          cartKey,
          productId,
          quantity,
          updatedBy,
        });
        const product = await Product.findById(productId);
        emitCartUpdate(cartKey, {
          type: "add",
          product: {
            productId: newProductInCart.productId,
            quantity: newProductInCart.quantity,
            name: product.name,
            image: product.image,
            updatedBy,
          },
        });

        if (explaination === "undo") {
          await TrainingExample.deleteOne({
            productId,
            label: 0,
          });
        }

        res.status(201).json({
          _id: productId,
          message: "Product readded to cart successfully.",
          productInCart: newProductInCart,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error adding product to cart.",
          error: error.message,
        });
      }
    },
  },
  get: {
    validator: async (req, res, next) => {
      const { cartKey } = req.params;
      const { userMail } = req.query;
      if (!cartKey || !userMail) {
        return res.status(400).json({
          error: "cartKey and mail are required.",
        });
      }
      next();
    },
    handler: async (req, res) => {
      const { cartKey } = req.params;
      const { userMail } = req.query;

      try {
        const [user, items] = await Promise.all([
          User.findOne({ mail: userMail }).select("nickname").lean(),
          ProductInCart.aggregate([
            { $match: { cartKey } },
            {
              //string to ObjectId (mongo)
              $addFields: {
                productObjectId: {
                  $toObjectId: "$productId",
                },
              },
            },
            {
              $lookup: {
                from: "products", //collection name
                localField: "productObjectId",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              //so we can do {"$product.name"} and not name[i]
              $unwind: {
                path: "$product",
                preserveNullAndEmptyArrays: true, //if null return null
              },
            },
            {
              //the fields
              $project: {
                _id: 0,
                productId: 1,
                quantity: 1,
                updatedBy: 1,
                name: "$product.name",
                image: "$product.image",
              },
            },
          ]),
        ]);

        const nickname = user?.nickname || "";

        if (items.length === 0) {
          return res.status(200).json({
            userNickname: nickname,
            products: [],
          });
        }

        res.status(200).json({
          userNickname: nickname,
          products: items,
        });
      } catch (error) {
        console.error("Error fetching products in cart:", error.message);
        res.status(500).json({
          error: "An error occurred while fetching products in cart.",
          details: error.message,
        });
      }
    },
  },
  put: {
    validator: async (req, res, next) => {
      const { cartKey, productId } = req.params;
      const { quantity, mail } = req.body;

      if (!cartKey || !productId || quantity === undefined || !mail) {
        return res.status(400).json({
          error: "cartKey, productId, quantity, and mail are required.",
        });
      }

      next();
    },
    handler: async (req, res) => {
      const { cartKey, productId } = req.params;
      const { quantity, mail } = req.body;

      try {
        const user = await User.findOne({ mail });
        const updatedBy = user.nickname;

        const updatedProductInCart = await ProductInCart.findOneAndUpdate(
          { cartKey, productId },
          { quantity, updatedBy },
          { new: true, runValidators: true }
        );
        if (!updatedProductInCart) {
          return res.status(404).json({ error: "Product not found in cart." });
        }

        emitCartUpdate(cartKey, {
          type: "update",
          productId,
          quantity,
          updatedBy,
        });

        res.status(200).json({
          message: "Product updated in cart successfully.",
          productInCart: updatedProductInCart,
        });
      } catch (error) {
        console.error("Error updating product in cart:", error.message);
        res.status(500).json({
          error: "An error occurred while updating the product in cart.",
        });
      }
    },
  },
  delete: {
    validator: async (req, res, next) => {
      const { cartKey, productId, mail } = req.params;

      if (!cartKey || !productId || !mail) {
        return res
          .status(400)
          .json({ error: "cartKey, productId and mail are required." });
      }

      try {
        const productExists = await Product.findById(productId);
        if (!productExists) {
          return res.status(404).json({
            error: "Product not found.",
          });
        }

        const cartExists = await Cart.findById(cartKey);
        if (!cartExists) {
          return res.status(404).json({
            error: "No cart found for the provided cartKey.",
            cartKey: cartKey,
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
      const { cartKey, productId, mail } = req.params;

      try {
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

        //fetch the product's features
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

        res.status(200).json({
          message: "Product removed from cart successfully.",
        });
      } catch (error) {
        console.error("Error deleting product from cart:", error.message);
        res.status(500).json({
          error: "An error occurred while deleting the product from cart.",
        });
      }
    },
  },
};
