import mongoose,{Schema} from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true, // reviews are tied to a completed order
    },
    targetType: {
      type: String,
      enum: ["Shop", "Product", "DeliveryPartner"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType", // dynamic reference based on targetType
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
  },
  { timestamps: true }
);

reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ order: 1, targetType: 1, targetId: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);