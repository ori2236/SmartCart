import mongoose from "mongoose";

const WeightsSchema = new mongoose.Schema(
  {
    featureName: {
      type: String,
      required: true,
      unique: true,
    },
    weight: {
      type: Number,
      required: true,
      default: 1,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

const Weights = mongoose.model("Weights", WeightsSchema, "weights");

export default Weights;
