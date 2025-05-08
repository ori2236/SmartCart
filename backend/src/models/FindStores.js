import mongoose from "mongoose";

const FindStoresSchema = new mongoose.Schema(
  {
    cart_address: String,
    product_name: String,
    stores: [[String]],
    last_updated: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 20, // 20 days
    },
  },
  { versionKey: false }
);

const FindStores = mongoose.model("FindStores", FindStoresSchema, "findStores");
export default FindStores;
