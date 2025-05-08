import mongoose from "mongoose";

const TrainingExampleSchema = new mongoose.Schema({
  features: {
    type: [Number], // כולל bias בתחילת הרשימה
    required: true,
  },
  label: {
    type: Number, // 0 או 1
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TrainingExample = mongoose.model(
  "TrainingExample",
  TrainingExampleSchema,
  "trainingExamples"
);

export default TrainingExample;
