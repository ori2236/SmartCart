import Cart from "../../models/Cart.js";
import UserInCart from "../../models/UserInCart.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { name, address, mail } = req.body;

      if (!name || !address || !mail) {
        return res
          .status(400)
          .json({ error: "cart name, address, and mail are required." });
      }

      next();
    },
    handler: async (req, res) => {
      const { name, address, mail } = req.body;

      try {
        const newCart = await Cart.create({ name, address });

        const newUserInCart = await UserInCart.create({
          cartKey: newCart._id,
          mail,
          role: "owner",
        });

        res.status(201).json({
          message: "inserted",
          cart: newCart.name,
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
      next();
    },
    handler: async (req, res) => {
      const { cartKey } = req.params;
      try {
        const cart = await Cart.findById(cartKey);
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
      const { cartKey } = req.params;
      const { name, address } = req.body;

      try {
        const updatedCart = await Cart.findByIdAndUpdate(
          cartKey,
          { name, address },
          { new: true, runValidators: true }
        );

        if (!updatedCart) {
          return res.status(404).json({
            message: "Cart not found",
          });
        }

        res.status(200).json({
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
      const { cartKey } = req.params;

      try {
        const deletedCart = await Cart.findByIdAndDelete(cartKey);

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

  getAll: {
    validator: async (req, res, next) => {
      next();
    },
    handler: async (req, res) => {
      try {
        const carts = await Cart.find({});
        res.json({
          message: "Fetched all carts",
          carts,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error fetching carts",
          error: error.message,
        });
      }
    },
  },
};
