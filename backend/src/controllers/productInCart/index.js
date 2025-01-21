import ProductInCart from "../../models/ProductInCart.js";
import Product from "../../models/Product.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { cartKey, productId, quantity } = req.body;

      if (!cartKey || !productId || quantity === undefined) {
        return res
          .status(400)
          .json({ error: "cartKey, productId, and quantity are required." });
      }

      next();
    },
    handler: async (req, res) => {
      const { cartKey, productId, quantity } = req.body;

      try {
        console.log("1");
        const existingProductInCart = await ProductInCart.findOne({
          cartKey,
          productId,
        });
        console.log("2");
        if (existingProductInCart) {
          return res
            .status(200)
            .json({ message: "Product already in the cart." });
        }
        console.log("3");
        const newProductInCart = await ProductInCart.create({
          cartKey,
          productId,
          quantity,
        });

        console.log("4");
        
        res.status(201).json({
          message: "Product added to cart successfully.",
          productInCart: newProductInCart,
        });
      } catch (error) {
        console.error("Error adding product to cart:", error.message);
        res.status(500).json({
          message: "Error adding product to cart.",
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
        if (type === "cartKey") {
            console.log("1")
          const productsInCart = await ProductInCart.find({ cartKey: content });
            console.log("2");
          if (!productsInCart) {
            console.log("2222");
            return res
              .status(404)
              .json({ error: "No products found for the provided cartKey." });
          }
          console.log("3");
          if (productsInCart.length === 0) {
            return res
              .status(200)
              .json({ message: "No products found for the provided cartKey." });
          }
          console.log("4");
          const productDetails = await Product.find({
            _id: { $in: productsInCart.map((item) => item.productId) },
          });
          console.log("5");
          const response = productsInCart.map((item) => {
            const product = productDetails.find(
              (prod) => prod._id.toString() === item.productId.toString()
            );
            return {
              productId: item.productId,
              quantity: item.quantity,
              ...(product && {
                name: product.name,
                description: product.description,
                price: product.price,
                image: product.image,
              }),
            };
          });

          return res.status(200).json(response);


          return res.status(200).json(response);
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
      const { quantity } = req.body;

      if (!cartKey || !productId || quantity === undefined) {
        return res
          .status(400)
          .json({ error: "cartKey, productId, and quantity are required." });
      }

      next();
    },
    handler: async (req, res) => {
      const { cartKey, productId } = req.params;
      const { quantity } = req.body;

      try {
        const updatedProductInCart = await ProductInCart.findOneAndUpdate(
          { cartKey, productId },
          { quantity },
          { new: true, runValidators: true }
        );

        if (!updatedProductInCart) {
          return res.status(404).json({ error: "Product not found in cart." });
        }

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

      next();
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
          return res.status(200).json({ message: "No products in cart found." });
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
