import mongoose from "mongoose";

const NotFoundStoresSchema = new mongoose.Schema(
  {
    cart_address: String,
    product_name: String,
    last_updated: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 3, // 3 days
    },
  },
  { versionKey: false }
);

const NotFoundStores = mongoose.model("NotFoundStores", NotFoundStoresSchema, "NotFoundStores");
export default NotFoundStores;
