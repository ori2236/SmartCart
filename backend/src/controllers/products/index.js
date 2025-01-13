import Product from "../../models/Product.js";

export default {
  post: {
    validator: async (req, res, next) => {
      // Check that the name and image are valid
      const { name, image } = req.body;

      if (!name || !image) {
        return res.status(400).json({ error: "Name and image are required." });
      }

      next();
    },
    handler: async (req, res) => {
      const { name, image } = req.body;

      try {
        const newProduct = await Product.create({
          name,
          image,
        });

        res.json({
          message: "Product created successfully",
          product: newProduct,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error creating product",
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
      const { id } = req.params;

      try {
        const product = await Product.findById(id);
        if (!product) {
          return res.status(404).json({
            message: "Product not found",
          });
        }

        res.json(product);
      } catch (error) {
        res.status(500).json({
          message: "Error fetching product",
          error: error.message,
        });
      }
    },
  },
  put: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      const { id } = req.params;
      const { name, image } = req.body;

      try {
        const updatedProduct = await Product.findByIdAndUpdate(
          id,
          { name, image },
          { new: true, runValidators: true }
        );

        if (!updatedProduct) {
          return res.status(404).json({
            message: "Product not found",
          });
        }

        res.json({
          message: "Product updated successfully",
          product: updatedProduct,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error updating product",
          error: error.message,
        });
      }
    },
  },
  delete: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      const { id } = req.params;

      try {
        const deletedProduct = await Product.findByIdAndDelete(id);
        if (!deletedProduct) {
          return res.status(404).json({
            message: "Product not found",
          });
        }

        res.json({
          message: "Product deleted successfully",
        });
      } catch (error) {
        res.status(500).json({
          message: "Error deleting product",
          error: error.message,
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
        await Product.deleteMany();

        res.json({
          message: "All products deleted successfully",
        });
      } catch (error) {
        res.status(500).json({
          message: "Error deleting all products",
          error: error.message,
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
        const products = await Product.find({});
        res.json({
          message: "Fetched all products",
          products,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error fetching products",
          error: error.message,
        });
      }
    },
  },
};
