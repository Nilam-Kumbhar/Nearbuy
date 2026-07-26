import mongoose,{Schema} from "mongoose";


const cartItemSchema = new Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    priceAtAdd: {
      type: Number,
      required: true, // snapshot, in case price changes before checkout
    },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one active cart per customer
    },
    shop: {
      // carts are single-shop; switching shops should prompt "clear cart?"
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },
    items: [cartItemSchema],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    couponCode: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const Cart =  mongoose.model("Cart", cartSchema);