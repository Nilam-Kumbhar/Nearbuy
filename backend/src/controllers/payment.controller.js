import Razorpay from "razorpay";
import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Payment } from "../models/Payment.model.js";
import { Order } from "../models/Order.model.js";

// Initialize Razorpay instance
const getRazorpayInstance = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        // Return dummy instance or fallback if environment variables are not set yet
        console.warn("Razorpay credentials missing in environment variables. Using placeholder keys.");
    }

    return new Razorpay({
        key_id: keyId || "rzp_test_placeholder",
        key_secret: keySecret || "rzp_secret_placeholder"
    });
};

// @desc    Initialize payment checkout (creates Razorpay order)
// @route   POST /api/v1/payments/checkout
// @access  Private (Customer)
const checkout = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        throw new ApiError(400, "Order ID is required for payment checkout");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.customer.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to pay for this order");
    }

    if (order.status === "cancelled" || order.status === "rejected") {
        throw new ApiError(400, `Cannot process payment for an order with status "${order.status}"`);
    }

    // Convert amount to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(order.grandTotal * 100);

    const razorpay = getRazorpayInstance();

    const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${order._id.toString().slice(-8)}_${Date.now()}`
    };

    let razorpayOrder;
    try {
        razorpayOrder = await razorpay.orders.create(options);
    } catch (err) {
        console.error("Razorpay order creation error:", err);
        throw new ApiError(500, err?.error?.description || "Failed to create Razorpay order");
    }

    // Create or update Payment record
    let payment = await Payment.findOne({ order: order._id });

    if (!payment) {
        payment = await Payment.create({
            order: order._id,
            customer: req.user._id,
            method: "razorpay",
            amount: order.grandTotal,
            currency: "INR",
            status: "pending",
            razorpayOrderId: razorpayOrder.id
        });
    } else {
        payment.method = "razorpay";
        payment.amount = order.grandTotal;
        payment.status = "pending";
        payment.razorpayOrderId = razorpayOrder.id;
        await payment.save();
    }

    // Link payment ID to Order
    order.payment = payment._id;
    order.paymentMethod = "online";
    await order.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderId: order._id,
                keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder"
            },
            "Razorpay order initialized successfully"
        )
    );
});

// @desc    Verify Razorpay payment signature & update Payment + Order status
// @route   POST /api/v1/payments/success
// @access  Private (Customer)
const paymentSuccess = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpayOrderId,
        razorpay_payment_id,
        razorpayPaymentId,
        razorpay_signature,
        razorpaySignature,
        orderId
    } = req.body;

    const rzpOrderId = razorpay_order_id || razorpayOrderId;
    const rzpPaymentId = razorpay_payment_id || razorpayPaymentId;
    const rzpSignature = razorpay_signature || razorpaySignature;

    if (!rzpOrderId || !rzpPaymentId || !rzpSignature) {
        throw new ApiError(400, "Missing required Razorpay payment verification parameters");
    }

    // Verify HMAC signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder";
    const body = `${rzpOrderId}|${rzpPaymentId}`;

    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(body.toString())
        .digest("hex");

    const isSignatureValid = expectedSignature === rzpSignature;

    let payment = await Payment.findOne({
        $or: [{ razorpayOrderId: rzpOrderId }, { order: orderId }]
    });

    if (!payment) {
        throw new ApiError(404, "Payment record not found for this transaction");
    }

    if (!isSignatureValid) {
        payment.status = "failed";
        payment.failureReason = "Invalid Razorpay HMAC signature";
        await payment.save();
        throw new ApiError(400, "Payment verification failed. Invalid signature.");
    }

    // Update Payment
    payment.status = "paid";
    payment.razorpayPaymentId = rzpPaymentId;
    payment.razorpaySignature = rzpSignature;
    await payment.save();

    // Update Order
    const order = await Order.findById(payment.order);
    if (order) {
        order.payment = payment._id;
        await order.save();
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                payment,
                order
            },
            "Payment verified and completed successfully"
        )
    );
});

// @desc    Handle payment failure notification
// @route   POST /api/v1/payments/failure
// @access  Private (Customer)
const paymentFailure = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpayOrderId, orderId, error, failureReason } = req.body;

    const rzpOrderId = razorpay_order_id || razorpayOrderId;

    let payment = await Payment.findOne({
        $or: [{ razorpayOrderId: rzpOrderId }, { order: orderId }]
    });

    const reason = typeof error === "string"
        ? error
        : error?.description || failureReason || "Payment failed or cancelled by user";

    if (payment) {
        payment.status = "failed";
        payment.failureReason = reason;
        await payment.save();
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                payment,
                reason
            },
            "Payment failure recorded successfully"
        )
    );
});

export {
    checkout,
    paymentSuccess,
    paymentFailure
};
