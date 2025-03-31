import mongoose from "mongoose";

const DistanceSchema = new mongoose.Schema(
  {
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { versionKey: false }
);

DistanceSchema.index({ from: 1, to: 1 }, { unique: true });

const Distance = mongoose.model("Distance", DistanceSchema);

export default Distance;
