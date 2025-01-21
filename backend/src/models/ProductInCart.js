import mongoose from "mongoose";

const ProductInCartSchema = new mongoose.Schema(
  {
    cartKey: {
      /////////////////////////////////////key
      type: String,
      required: true,
    },
    productId: {
      /////////////////////////////////////key
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { versionKey: false }
);

ProductInCartSchema.index({ cartKey: 1, productId: 1 }, { unique: true });

const ProductInCart = mongoose.model("ProductInCart", ProductInCartSchema);

export default ProductInCart;