import Razorpay from "razorpay";
import crypto from "crypto";
import Payment from "../models/paymentModel.js";
import { MESSAGES } from "../utils/messages.js";
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
export const createOrder = async (req, res) => {
  try {
    const options = { amount: req.body.amount * 100, currency: "INR" };
    const order = await razorpay.orders.create(options);
    await Payment.create({ orderId: order.id, amount: order.amount });
    res.status(201).json({
      success: true,
      message: MESSAGES.PAYMENT.ORDER_CREATED,
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: MESSAGES.PAYMENT.ORDER_FAILED, error: err.message });
  }
};
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(sign).digest("hex");
    if (expected === razorpay_signature) {
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { paymentId: razorpay_payment_id, signature: razorpay_signature, status: "paid" }
      );
      res.status(200).json({ success: true, message: MESSAGES.PAYMENT.VERIFIED_SUCCESS });
    } else {
      await Payment.findOneAndUpdate({ orderId: razorpay_order_id }, { status: "failed" });
      res.status(400).json({ success: false, message: MESSAGES.PAYMENT.VERIFIED_FAIL });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: MESSAGES.GENERAL.SERVER_ERROR, error: err.message });
  }
};