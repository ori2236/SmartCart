import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String, // Expecting base64 string
      required: true,
    },
  },
  { versionKey: false }
);

const Product = mongoose.model("Product", ProductSchema);

export default Product;
