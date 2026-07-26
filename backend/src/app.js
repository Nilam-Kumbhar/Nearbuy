import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json()) //accept data from json file
app.use(express.urlencoded({extended:true})) //accepts data from url
// extended - obj in obj nested obj
app.use(express.static("public")) //this used to store img, febicon,pdf data

app.use(cookieParser())

import userRouter from './routes/user.routes.js';
import shopRouter from './routes/shop.routes.js';
import productRouter from './routes/product.routes.js';
import cartRouter from './routes/cart.routes.js';
import orderRouter from './routes/order.routes.js';
import paymentRouter from './routes/payment.routes.js';
import reviewRouter from './routes/review.routes.js';
import deliveryRouter from './routes/delivery.routes.js';

import errorHandler from './middlewares/error.middleware.js';

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/shops", shopRouter);
app.use("/api/v1/shop", shopRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/review", reviewRouter);
app.use("/api/v1/delivery", deliveryRouter);

// Global Error Handler
app.use(errorHandler);

export {app}