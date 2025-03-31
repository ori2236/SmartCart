import mongoose from "mongoose";

const SupermarketImageSchema = new mongoose.Schema(
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

const SupermarketImage = mongoose.model(
  "SupermarketImage",
  SupermarketImageSchema
);

export default SupermarketImage;
