import mongoose,{Schema} from "mongoose";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shopCategory: {
      // links this product-category to a shop type e.g. "Grocery" -> "Dairy"
      type: String,
      enum: ["Grocery", "Bakery", "Pharmacy", "Electronics", "Clothing"],
      required: true,
    },
    icon: {
      type: String, // emoji or icon key used by frontend
      default: "🛒",
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null, // supports subcategories, e.g. Dairy under Grocery
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1, shopCategory: 1 }, { unique: true });

export const Category =  mongoose.model("Category", categorySchema);