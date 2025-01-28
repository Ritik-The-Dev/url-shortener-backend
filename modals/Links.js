import mongoose from "mongoose";

const LinkLogsSchema = new mongoose.Schema(
  {
    timeStamp: {
      type: Date,
      default: () => new Date(),
    },
    ipAddress: {
      type: String,
      required: true, 
    },
    userDevice: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const LinksModel = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    destinationUrl: {
      type: String,
      required: true,
    },
    shortLink: {
      type: String,
      required: true,
      unique: true,
    },
    remarks: {
      type: String,
    },
    expirationEnabled: {
      type: Boolean,
      default: false,
    },
    expirationDate: {
      type: Date,
    },
    logs: [LinkLogsSchema], 
  },
  { timestamps: true }
);

const UserLinks =
  mongoose.models.UserLinks || mongoose.model("UserLinks", LinksModel);

export default UserLinks;
