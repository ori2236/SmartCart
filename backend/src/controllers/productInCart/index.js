import { emitCartUpdate } from "../../socket.js";
import ProductInCart from "../../models/ProductInCart.js";
import Product from "../../models/Product.js";
import Cart from "../../models/Cart.js";
import User from "../../models/User.js";
import ProductController from "../products/index.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { name, image, cartKey, quantity, mail } = req.body;
      if (!name || !image || !cartKey || quantity === undefined || !mail) {
        return res.status(400).json({
          error: "name, image, cartKey, quantity, and mail are required.",
        });
      }

      next();
    },
    handler: async (req, res) => {
      const { name, image, cartKey, quantity, mail } = req.body;
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

        emitCartUpdate(cartKey, {
          type: "add",
          product: {
            productId: newProductInCart.productId,
            quantity: newProductInCart.quantity,
            name: product.name,
            image: product.image,
          },
        });

        res.status(201).json({
          _id: productId,
          message: "Product added to cart successfully.",
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
      const { type, content } = req.params;
      const { userMail } = req.query;
      if (!type || !content || !userMail) {
        return res.status(400).json({
          error: "type, content and mail are required.",
        });
      }
      next();
    },
    handler: async (req, res) => {
      const { type, content } = req.params;
      const { userMail } = req.query;

      try {
        if (type === "cartKey") {
          const productsInCart = await ProductInCart.find({ cartKey: content });
          if (productsInCart.length === 0) {
            const user = await User.findOne({ mail: userMail });
            const nickname = user?.nickname || "";

            return res.status(200).json({
              userNickname: nickname,
              products: [],
            });
          }

          const productDetails = await Product.find({
            _id: { $in: productsInCart.map((item) => item.productId) },
          });

          const user = await User.findOne({ mail: userMail });
          const nickname = user.nickname;

          const response = productsInCart.map((item) => {
            const product = productDetails.find(
              (prod) => prod._id.toString() === item.productId.toString()
            );

            return {
              productId: item.productId,
              quantity: item.quantity,
              updatedBy: item.updatedBy,
              ...(product && {
                name: product.name,
                image: product.image,
              }),
            };
          });
          return res.status(200).json({
            userNickname: nickname,
            products: response,
          });
        } else {
          return res
            .status(400)
            .json({ error: "Invalid type. Use 'cartKey'." });
        }
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
      const { cartKey, productId } = req.params;

      if (!cartKey || !productId) {
        return res
          .status(400)
          .json({ error: "cartKey and productId are required." });
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
      const { cartKey, productId } = req.params;

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
  deleteAll: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      try {
        const result = await ProductInCart.deleteMany({});
        res.status(200).json({
          message: `Deleted ${result.deletedCount} products from cart.`,
        });
      } catch (error) {
        console.error("Error deleting all products from cart:", error.message);
        res.status(500).json({
          error: "An error occurred while deleting all products from cart.",
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
        const productsInCart = await ProductInCart.find({});
        if (!productsInCart) {
          return res.status(404).json({ error: "No products in cart found." });
        } else if (productsInCart.length === 0) {
          return res
            .status(200)
            .json({ message: "No products in cart found." });
        }
        res.status(200).json(productsInCart);
      } catch (error) {
        console.error("Error fetching all products in cart:", error.message);
        res.status(500).json({
          error: "An error occurred while fetching all products in cart.",
        });
      }
    },
  },
};
