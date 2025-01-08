import mongoose from "mongoose";

const CartSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  address: {
    type: String,
    required: true,
  }
}, { versionKey: false }
);

const Cart = mongoose.model("Cart", CartSchema);

export default Cart;