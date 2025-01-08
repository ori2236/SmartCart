import Cart from "../../models/Cart.js";

export default {
  post: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      const name = req.body.name;
      const address = req.body.address;

      try {
        const newCart = await Cart.create({
          name,
          address,
        });

        res.json({
          message: "inserted",
          cart: newCart,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error inserting cart",
          error: error.message,
        });
      }
    },
  },
  get: {
    validator: async (req, res, next) => {
      //check that the address is valid
      console.log("cart");
      next();
    },
    handler: async (req, res) => {
      const key = req.params.id;

      try {
        const cart = await Cart.findOne({ key });
        if (!cart) {
          return res.status(404).json({
            message: "Cart not found",
          });
        }
        res.json(cart);
      } catch (error) {
        res.status(500).json({
          message: "Error fetching cart",
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
      const key = req.params.id;
      const name = req.body.name;
      const address = req.body.address;

      try {
        const updatedCart = await Cart.findOneAndUpdate(
          { key },
          { name, key, address },
          { new: true, runValidators: true }
        );

        if (!updatedCart) {
          return res.status(404).json({
            message: "Cart not found",
          });
        }

        res.json({
          message: "updated",
          cart: updatedCart,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error updating cart",
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
      const key = req.params.id;

      try {
        const deletedCart = await Cart.findByIdAndDelete(key);

        if (!deletedCart) {
          return res.status(404).json({
            message: "Cart not found",
          });
        }

        res.json({
          message: "deleted",
        });
      } catch (error) {
        res.status(500).json({
          message: "Error deleting cart",
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
        await Cart.deleteMany();

        res.json({
          message: "deleted all",
        });
      } catch (error) {
        res.status(500).json({
          message: "Error deleting all carts",
          error: error.message,
        });
      }
    },
  },
};
