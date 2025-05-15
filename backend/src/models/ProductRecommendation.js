import mongoose from "mongoose";

const ProductRecommendationSchema = new mongoose.Schema(
  {
    sourceProductId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    recommendations: [
      {
        productId: String,
        score: Number,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 7,
    },
  },
  { versionKey: false }
);

const ProductRecommendation = mongoose.model(
  "ProductRecommendation",
  ProductRecommendationSchema,
  "productRecommendations"
);

export default ProductRecommendation;
