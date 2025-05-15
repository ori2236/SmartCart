import mongoose from "mongoose";

const TrainingExampleSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    features: {
      type: [Number],
      required: true,
    },
    label: {
      type: Number, //0 or 1
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

const TrainingExample = mongoose.model(
  "TrainingExample",
  TrainingExampleSchema,
  "trainingExamples"
);

export default TrainingExample;
