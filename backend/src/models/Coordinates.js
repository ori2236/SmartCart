import mongoose from "mongoose";

const CoordinatesSchema = new mongoose.Schema(
  {
    Address: {
      type: String,
      required: true,
      unique: true,
    },
    Latitude: {
      type: Number,
      required: true,
    },
    Longitude: {
      type: Number,
      required: true,
    },
  },
  { versionKey: false }
);

const Coordinates = mongoose.model("Coordinates", CoordinatesSchema);

export default Coordinates;
