const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    respondedAt: { type: Date },
  },
  { timestamps: true },
);

connectionRequestSchema.index(
  { requester: 1, recipient: 1 },
  { unique: true, name: "unique_connection_direction" },
);

module.exports = mongoose.model("ConnectionRequest", connectionRequestSchema);
