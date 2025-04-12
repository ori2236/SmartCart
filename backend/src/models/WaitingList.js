import mongoose from "mongoose";

const WaitingListSchema = new mongoose.Schema(
  {
    cartKey: {
      /////////////////////////////////////key
      type: String,
      required: true,
    },
    mail: {
      /////////////////////////////////////key
      type: String,
      required: true,
    },
  },
  { versionKey: false }
);

WaitingListSchema.index({ cartKey: 1, mail: 1 }, { unique: true });

const WaitingList = mongoose.model("WaitingList", WaitingListSchema);

export default WaitingList;
