import UserInCart from "../../models/UserInCart.js";
import Cart from "../../models/Cart.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { cartKey, mail, role } = req.body;

      if (!cartKey || !mail || !role) {
        return res
          .status(400)
          .json({ error: "cartKey, mail, and role are required." });
      }

      next();
    },
    handler: async (req, res) => {
      const { cartKey, mail, role } = req.body;

      try {
        const existingRelationship = await UserInCart.findOne({
          cartKey,
          mail,
        });
        if (existingRelationship) {
          return res
            .status(400)
            .json({ error: "Duplicate cartKey and mail combination." });
        }

        const newUserInCart = await UserInCart.create({ cartKey, mail, role });

        res.status(201).json({
          message: "User-cart relationship inserted successfully",
          userInCart: newUserInCart,
        });
      } catch (error) {
        console.error("Error inserting user-cart relationship:", error.message);
        res.status(500).json({
          message: "Error inserting user-cart relationship",
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
          const userInCarts = await UserInCart.find({ mail: content });
          if (userInCarts.length === 0){
            return res.status(200).json({
              message: "No user-cart relationships found for the provided mail.",
            });
          }
          if (!userInCarts) {
            return res.status(404).json({
              error:
                "No user-cart relationships found for the provided mail.",
            });
          }

          const cartsDetails = await Cart.find({
            _id: { $in: userInCarts.map((userInCart) => userInCart.cartKey) },
          });

          const response = userInCarts.map((userInCart) => {
            const cart = cartsDetails.find(
              (cart) => cart._id.toString() === userInCart.cartKey.toString()
            );
            return {
              cartKey: userInCart.cartKey,
              role: userInCart.role,
              ...(cart && { name: cart.name, address: cart.address }),
            };
          });

          return res.status(200).json(response);
        } else if (type === "key") {
          const userInCart = await UserInCart.findOne({ cartKey: content });

          if (!userInCart) {
            return res.status(404).json({
              error:
                "No user-cart relationship found for the provided cart key.",
            });
          }

          const cart = await Cart.findOne({ _id: userInCart.cartKey });

          if (!cart) {
            return res.status(404).json({
              error: "No cart found for the provided cart key.",
            });
          }

          const response = {
            cartKey: userInCart.cartKey,
            role: userInCart.role,
            name: cart.name,
            address: cart.address,
          };

          return res.status(200).json(response);
        } else {
          return res
            .status(400)
            .json({ error: "Invalid type. Use 'mail' or 'key'." });
        }
      } catch (error) {
        console.error("Error in userInCart get handler:", error.message);
        res.status(500).json({
          error: "An error occurred while processing your request.",
        });
      }
    },
  },
  put: {
    validator: async (req, res, next) => {
      const { mail, cartKey } = req.params;
      const { role } = req.body;

      if (!mail || !cartKey || !role) {
        return res
          .status(400)
          .json({ error: "mail, cartKey, and role are required." });
      }

      next();
    },
    handler: async (req, res) => {
      const { mail, cartKey } = req.params;
      const { role } = req.body;

      try {
        const updatedUserInCart = await UserInCart.findOneAndUpdate(
          { mail, cartKey },
          { role },
          { new: true, runValidators: true }
        );

        if (!updatedUserInCart) {
          return res.status(404).json({
            error:
              "No user-cart relationship found for the provided mail and cartKey.",
          });
        }

        res.status(200).json({
          message: "User-cart relationship updated successfully.",
          userInCart: updatedUserInCart,
        });
      } catch (error) {
        console.error("Error in put handler:", error.message);
        res.status(500).json({
          error: "An error occurred while updating the user-cart relationship.",
        });
      }
    },
  },
  delete: {
    validator: async (req, res, next) => {
      const { mail, cartKey } = req.params;
      if (!mail || !cartKey) {
        return res.status(400).json({
          error: "Both 'mail' and 'cartKey' are required.",
        });
      }
      next();
    },
    handler: async (req, res) => {
      const { mail, cartKey } = req.params;

      try {
        const deletedUserInCart = await UserInCart.findOneAndDelete({
          mail,
          cartKey,
        });

        if (!deletedUserInCart) {
          return res.status(404).json({
            error:
              "No user-cart relationship found for the provided mail and cartKey.",
          });
        }

        res.status(200).json({
          message: "User-cart relationship deleted successfully.",
          deletedUserInCart,
        });
      } catch (error) {
        console.error("Error in delete handler:", error.message);
        res.status(500).json({
          error: "An error occurred while deleting the user-cart relationship.",
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
        const result = await UserInCart.deleteMany({});
        return res.status(200).json({
          message: `Deleted ${result.deletedCount} user-cart relationships.`,
        });
      } catch (error) {
        console.error("Error in deleteAll handler:", error);
        return res.status(500).json({
          error:
            "An error occurred while deleting all user-cart relationships.",
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
        const userInCarts = await UserInCart.find({});

        if (!userInCarts || userInCarts.length === 0) {
          return res.status(404).json({
            error: "No user-cart relationships found.",
          });
        }

        res.status(200).json({
          message: "Fetched all user-cart relationships successfully.",
          userInCarts,
        });
      } catch (error) {
        console.error("Error in getAll handler:", error.message);
        res.status(500).json({
          error:
            "An error occurred while fetching all user-cart relationships.",
        });
      }
    },
  },
};