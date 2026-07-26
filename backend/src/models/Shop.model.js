import mongoose,{Schema} from "mongoose";

const shopSchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    category: {
      type: String,
      enum: ["Grocery", "Bakery", "Pharmacy", "Electronics", "Clothing"],
      required: true,
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    gstNumber: {
      type: String,
      default: null, // optional
    },
    address: {
      addressLine: String,
      city: String,
      pincode: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [lng, lat]
      },
    },
    businessHours: {
      opensAt: { type: String, default: "09:00" }, // "HH:mm"
      closesAt: { type: String, default: "21:00" },
      workingDays: {
        type: [String],
        default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
    },
    isOpen: {
      type: Boolean,
      default: true, // manual override by shop owner
    },
    isApproved: {
      type: Boolean,
      default: false, // admin verification before going live
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    deliveryRadiusKm: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true }
);

shopSchema.index({ "address.location": "2dsphere" });

export const Shop = mongoose.model("Shop", shopSchema);