import UserInCart from "../../models/UserInCart.js";
import Cart from "../../models/Cart.js";
import User from "../../models/User.js";
import WaitingList from "../../models/WaitingList.js";

export default {
  post: {
    validator: async (req, res, next) => {
      const { cartKey, mail } = req.body;

      if (!cartKey || !mail) {
        return res
          .status(400)
          .json({ error: "cartKey and mail are required." });
      }

      next();
    },
    handler: async (req, res) => {
      const { cartKey, mail } = req.body;

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

        const inWaitingList = await WaitingList.findOne({
          cartKey,
          mail,
        });
        if (!inWaitingList) {
          return res.status(400).json({
            error: "The user is not in the waiting list for this cart",
          });
        }

        const deletedWaitingList = await WaitingList.findOneAndDelete({
          mail,
          cartKey,
        });

        if (!deletedWaitingList) {
          return res.status(404).json({
            error:
              "No user-cart relationship found for deleting for the provided mail and cartKey.",
          });
        }

        const newUserInCart = await UserInCart.create({
          cartKey,
          mail,
          role: "member",
        });

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
          if (userInCarts.length === 0) {
            return res.status(200).json({
              message:
                "No user-cart relationships found for the provided mail.",
            });
          }
          if (!userInCarts) {
            return res.status(404).json({
              error: "No user-cart relationships found for the provided mail.",
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
        } else if (type === "cartKey") {
          const userInCart = await UserInCart.find({ cartKey: content });
          if (userInCart.length === 0) {
            return res.status(200).json({
              message: "No users found for the provided cartKey.",
            });
          }

          const userMails = userInCart.map((entry) => entry.mail);

          const users = await User.find(
            { mail: { $in: userMails } },
            { mail: 1, nickname: 1, _id: 0 }
          );

          const mailToNickname = {};
          users.forEach((user) => {
            mailToNickname[user.mail] = user.nickname;
          });

          const response = userInCart.map((entry) => ({
            mail: entry.mail,
            role: entry.role,
            nickname: mailToNickname[entry.mail],
          }));

          return res.status(200).json(response);
        } else {
          return res
            .status(400)
            .json({ error: "Invalid type. Use 'mail' or 'cartKey'" });
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

      if (!mail || !cartKey) {
        return res
          .status(400)
          .json({ error: "mail and cartKey are required." });
      }

      next();
    },
    handler: async (req, res) => {
      const { mail, cartKey } = req.params;

      const existingRelationship = await UserInCart.findOne({
        cartKey,
        mail,
      });

      const newRole =
        existingRelationship.role === "member" ? "admin" : "member";

      try {
        const updatedUserInCart = await UserInCart.findOneAndUpdate(
          { mail, cartKey },
          { role: newRole },
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
        const existingRelationship = await UserInCart.findOne({
          cartKey,
          mail,
        });

        if (!existingRelationship) {
          return res.status(404).json({
            error:
              "No user-cart relationship found for the provided mail and cartKey.",
          });
        }

        const allUsers = await UserInCart.find({ cartKey });

        if (existingRelationship.role === "owner") {
          const others = allUsers.filter((user) => user.mail !== mail);

          if (others.length === 0) {
            await Cart.findByIdAndDelete(cartKey);
            await UserInCart.deleteMany({ cartKey });
            return res.status(200).json({
              message: "Owner was the only user in the cart. Cart deleted.",
            });
          }

          const randomAdmin =
            others.find((u) => u.role === "admin") ||
            others.find((u) => u.role === "member");

          if (randomAdmin) {
            await UserInCart.updateOne(
              { cartKey, mail: randomAdmin.mail },
              { role: "owner" }
            );
          }
        }

        await UserInCart.findOneAndDelete({ mail, cartKey });

        res.status(200).json({
          message: "User-cart relationship deleted successfully.",
        });
      } catch (error) {
        console.error("Error in delete handler:", error.message);
        res.status(500).json({
          error: "An error occurred while deleting the user-cart relationship.",
        });
      }
    },
  },
};
