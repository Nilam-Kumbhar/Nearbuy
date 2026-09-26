import mongoose, { Schema } from "mongoose";


const productSchema = new Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    images: [
      {
        url: String,
        publicId: String,
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 90,
    },
    unit: {
      type: String, // e.g. "1 kg", "500 ml", "1 pc"
      default: "1 pc",
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5, // used by AI low-stock alert feature
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    salesCount: {
      type: Number,
      default: 0, // incremented on each order, feeds recommendation/trending logic
    },
  },
  { timestamps: true }
);

productSchema.index({ shop: 1, category: 1 });
productSchema.index({ name: "text" }); // supports smart/text search

export const Product = mongoose.model("Product", productSchema);