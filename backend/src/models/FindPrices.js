import mongoose from "mongoose";

const FindPricesSchema = new mongoose.Schema(
  {
    product_name:    String,
    store_name:      String,
    store_address:   String,
    regular_price:   Number,
    sale_price:      Number,
    required_quantity: Number,
    last_updated: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 3, //3 days
    },
  },
  { versionKey: false }
);

FindPricesSchema.index(
  { product_name: 1, store_name: 1, store_address: 1 },
  { unique: true }
);

export default mongoose.model(
  "FindPrices",
  FindPricesSchema,
  "findPrices"
);
