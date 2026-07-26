import mongoose,{Schema} from "mongoose";

const deliveryPartnerSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      enum: ["bike", "bicycle", "scooter", "on_foot"],
      default: "bike",
    },
    vehicleNumber: String,
    licenseDocUrl: String, // uploaded for verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: false, // toggled on/off by the rider ("go online")
    },
    currentLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // updated live via socket
    },
    activeOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    earnings: {
      total: { type: Number, default: 0 },
      pendingPayout: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

deliveryPartnerSchema.index({ currentLocation: "2dsphere" });

export const DeliveryPartner = mongoose.model("DeliveryPartner", deliveryPartnerSchema);