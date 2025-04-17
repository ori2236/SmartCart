import mongoose from "mongoose";

const InvalidProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  { versionKey: false }
);

const InvalidProduct = mongoose.model("InvalidProduct", InvalidProductSchema);

export default InvalidProduct;
