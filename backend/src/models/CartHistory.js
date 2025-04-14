import mongoose from "mongoose";

const CartHistorySchema = new mongoose.Schema(
  {
    cartKey: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

CartHistorySchema.index({ cartKey: 1, productId: 1, date: 1 });

const CartHistory = mongoose.model(
  "CartHistory",
  CartHistorySchema,
  "cartHistory"
);


export default CartHistory;