import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/userModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { generateTokens } from "../utils/generateToken.js";
import { MESSAGES } from "../utils/messages.js";
const {
  FAST2SMS_API_KEY,
  ENABLE_SMS,
  FAST2SMS_SENDER_ID = "MYPROO",
  ADMIN_PHONE,
  DLT_ENTITY_ID,
  DLT_TEMPLATE_ID,
  JWT_REFRESH_SECRET
} = process.env;
const otpStore = new Map();
const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();
const validateIndianPhone = (phone) => /^[6-9]\d{9}$/.test(phone);
const formatPhone = (phone) => phone.replace(/\D/g, "");
const sendOtpSMS = async (phone, otp) => {
  if (ENABLE_SMS !== "true") {
    console.log("🚫 SMS Disabled. OTP:", otp);
    return;
  }

  const payload = {
    route: "dlt",
    sender_id: FAST2SMS_SENDER_ID,
    message: DLT_TEMPLATE_ID,
    variables_values: otp,
    numbers: phone,
    entity_id: DLT_ENTITY_ID
  };

  try {
    const { data } = await axios.post("https://www.fast2sms.com/dev/bulkV2", payload, {
      headers: {
        authorization: FAST2SMS_API_KEY,
        "Content-Type": "application/json"
      }
    });

    if (data.return !== true) {
      throw new ApiError(data.message || MESSAGES.AUTH.OTP_FAILED, 500);
    }

    console.log("✅ OTP Sent:", data);
  } catch (err) {
    console.error("🚫 OTP send failed:", err.response?.data || err.message);
    throw new ApiError(MESSAGES.AUTH.OTP_FAILED, 500);
  }
};
export const sendOtp = asyncHandler(async (req, res) => {
  const { phone, role } = req.body;

  if (!phone) throw new ApiError(MESSAGES.AUTH.PHONE_ROLE_REQUIRED, 400);
  if (!validateIndianPhone(phone)) throw new ApiError(MESSAGES.AUTH.INVALID_PHONE, 400);

  const formattedPhone = formatPhone(phone);
  const isAdmin = formattedPhone === ADMIN_PHONE;
  if (!isAdmin && !role)
    throw new ApiError(MESSAGES.AUTH.PHONE_ROLE_REQUIRED, 400);

  const existingUser = await User.findOne({ phone: formattedPhone });
  if (
    !isAdmin &&
    existingUser &&
    existingUser.role.length > 0 &&
    !existingUser.role.includes(role)
  ) {
    throw new ApiError(
      `This phone number is already registered as ${existingUser.role[0]}. You cannot register as a different role.`,
      400
    );
  }

  const existingOtp = otpStore.get(formattedPhone);
  if (existingOtp && Date.now() - existingOtp.createdAt < 30000)
    throw new ApiError(MESSAGES.AUTH.OTP_RESEND_WAIT, 429);

  const otp = generateOtp();

  otpStore.set(formattedPhone, {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    createdAt: Date.now()
  });

  console.log(`📱 OTP for ${formattedPhone}: ${otp}`);

  await sendOtpSMS(formattedPhone, otp);

  res.status(200).json({
    success: true,
    message: MESSAGES.AUTH.OTP_SENT
  });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) throw new ApiError(MESSAGES.AUTH.PHONE_REQUIRED, 400);
  if (!validateIndianPhone(phone))
    throw new ApiError(MESSAGES.AUTH.INVALID_PHONE, 400);

  const formattedPhone = formatPhone(phone);
  const existing = otpStore.get(formattedPhone);

  if (!existing)
    throw new ApiError(MESSAGES.AUTH.OTP_NOT_FOUND, 400);

  if (Date.now() - existing.createdAt < 30000)
    throw new ApiError(MESSAGES.AUTH.OTP_RESEND_WAIT, 429);

  const otp = generateOtp();
  otpStore.set(formattedPhone, {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    createdAt: Date.now()
  });

  console.log(`🔁 Resent OTP for ${formattedPhone}: ${otp}`);
  await sendOtpSMS(formattedPhone, otp);

  res.status(200).json({
    success: true,
    message: MESSAGES.AUTH.OTP_RESEND_SUCCESS
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp, role } = req.body;

  if (!phone || !otp)
    throw new ApiError(MESSAGES.AUTH.OTP_INVALID, 400);

  const formattedPhone = formatPhone(phone);
  const otpData = otpStore.get(formattedPhone);

  if (!otpData)
    throw new ApiError(MESSAGES.AUTH.OTP_EXPIRED, 400);
  if (otpData.code !== otp)
    throw new ApiError(MESSAGES.AUTH.OTP_INCORRECT, 400);
  otpStore.delete(formattedPhone);
  let user;
  const isAdmin = formattedPhone === ADMIN_PHONE;
  if (isAdmin) {
    user =
      (await User.findOne({ phone: formattedPhone })) ||
      (await User.create({ phone: formattedPhone, role: ["admin"] }));

    if (!user.role.includes("admin")) {
      user.role = ["admin"];
      await user.save();
    }

    const tokens = generateTokens(user);
    const allUsers = await User.find({}).select("-__v");

    return res.status(200).json({
      success: true,
      message: MESSAGES.AUTH.ADMIN_LOGIN_SUCCESS,
      user,
      ...tokens,
      allUsers
    });
  }

  if (!role)
    throw new ApiError(MESSAGES.AUTH.PHONE_ROLE_REQUIRED, 400);
  const existingUser = await User.findOne({ phone: formattedPhone });
  if (
    existingUser &&
    existingUser.role.length > 0 &&
    !existingUser.role.includes(role)
  ) {
    throw new ApiError(
      `This phone number is already registered as ${existingUser.role[0]}. You cannot register as a different role.`,
      400
    );
  }

  if (existingUser) {
    if (existingUser.isDeleted) {
      existingUser.isDeleted = false;
      await existingUser.save();
    }
    user = existingUser;
  } else {
    user = await User.create({ phone: formattedPhone, role: [role] });
  }

  const tokens = generateTokens(user);

  res.status(200).json({
    success: true,
    message: MESSAGES.AUTH.LOGIN_SUCCESS,
    user,
    ...tokens
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: clientToken } = req.body;
  if (!clientToken) throw new ApiError(MESSAGES.AUTH.TOKEN_MISSING, 401);
  try {
    const decoded = jwt.verify(clientToken, JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(MESSAGES.AUTH.USER_NOT_FOUND, 401);
    const tokens = generateTokens(user);

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      ...tokens
    });
  } catch {
    throw new ApiError(MESSAGES.AUTH.TOKEN_INVALID, 401);
  }
});

export const profile = asyncHandler(async (req, res) => {
  const isAdmin = req.user.phone === ADMIN_PHONE;

  if (isAdmin) {
    const users = await User.find({}).select("-__v");
    return res.status(200).json({ success: true, users });
  }

  const user = await User.findById(req.user._id).select("-__v");
  if (!user) throw new ApiError(MESSAGES.AUTH.USER_NOT_FOUND, 404);

  res.status(200).json({ success: true, user });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetUser = await User.findById(id);
  if (!targetUser) throw new ApiError(MESSAGES.AUTH.USER_NOT_FOUND, 404);

  const isAdmin = req.user.phone === ADMIN_PHONE;
  const isOwner = targetUser._id.equals(req.user._id);

  if (!isAdmin && !isOwner)
    throw new ApiError(MESSAGES.AUTH.NOT_AUTHORIZED, 403);

  targetUser.isDeleted = true;
  await targetUser.save();

  res.status(200).json({
    success: true,
    message: MESSAGES.AUTH.ACCOUNT_DELETED
  });
});
