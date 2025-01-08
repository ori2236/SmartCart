import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  destDate: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  subjectId: {
    type: String,
    required: true,
  },
});

const Assignment = mongoose.model("Assignment", AssignmentSchema);

export default Assignment;