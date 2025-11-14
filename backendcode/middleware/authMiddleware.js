import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { MESSAGES } from "../utils/messages.js";
import ApiError from "../utils/apiError.js";
export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) throw new ApiError(MESSAGES.AUTH.TOKEN_MISSING, 401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(MESSAGES.AUTH.USER_NOT_FOUND, 401);
    if (user.isDeleted)
      throw new ApiError(MESSAGES.AUTH.ACCOUNT_DELETED, 403);
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.AUTH.TOKEN_INVALID,
        details: "Access token invalidated. Please login again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: MESSAGES.AUTH.TOKEN_INVALID,
        details: "Access token expired. Use refresh token to get a new one.",
      });
    }
    return res
      .status(401)
      .json({ success: false, message: MESSAGES.AUTH.TOKEN_INVALID });
  }
};
