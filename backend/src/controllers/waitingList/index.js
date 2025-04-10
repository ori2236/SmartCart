import WaitingList from "../../models/WaitingList.js";
import Cart from "../../models/Cart.js";
import UserInCart from "../../models/UserInCart.js";
import User from "../../models/User.js";
import mongoose from "mongoose";

export default {
  post: {
    validator: async (req, res, next) => {
      const { cartKey, mail } = req.body;

      if (!cartKey || !mail) {
        return res
          .status(400)
          .json({ error: "cartKey and mail are required." });
      }


      let cart = null;
      try {
        if (mongoose.Types.ObjectId.isValid(cartKey)) {
          cart = await Cart.findById(cartKey);
        }

        if (!cart) {
          return res.status(404).json({ error: "The cart doesn't exist" });
        }

      } catch (error) {
        console.error("Error while validating cart:", error.message);
        return res
          .status(500)
          .json({ error: "Server error while validating cart" });
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
            .json({ error: "The user is already in this cart" });
        }

        const inWaitingList = await WaitingList.findOne({
          cartKey,
          mail,
        });
        if (inWaitingList) {
          return res
            .status(400)
            .json({ error: "The user is on the waiting list for this cart" });
        }

        const newInWaitingList = await WaitingList.create({ cartKey, mail });

        res.status(201).json({
          message: "User-cart relationship inserted successfully",
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
        if (type === "cartKey") {
          const waitingList = await WaitingList.find({ cartKey: content });
          if (waitingList.length === 0){
            return res.status(200).json({
              message: "No users found for the provided cartKey.",
            });
          }

          const userMails = waitingList.map((entry) => entry.mail);

          const response = await User.find(
            { mail: { $in: userMails } },
            { mail: 1, nickname: 1, _id: 0 } // Only return mail and nickname
          );

          return res.status(200).json(response);
        }
      } catch (error) {
        console.error("Error in waitingList get handler:", error.message);
        res.status(500).json({
          error: "An error occurred while processing your request.",
        });
      }
    },
  },
  delete: {
    validator: async (req, res, next) => {
      const { mail, cartKey } = req.params;
      if (!mail || !cartKey) {
        return res.status(400).json({ error: "cartKey and mail are required." });
      }
      next();
    },
    handler: async (req, res) => {
      const { mail, cartKey } = req.params;

      try {
        const deletedWaitingList = await WaitingList.findOneAndDelete({
          mail,
          cartKey,
        });

        if (!deletedWaitingList) {
          return res.status(404).json({
            error:
              "No user-cart relationship found for the provided mail and cartKey.",
          });
        }

        res.status(200).json({
          message: "User-cart relationship deleted successfully.",
          deletedWaitingList,
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