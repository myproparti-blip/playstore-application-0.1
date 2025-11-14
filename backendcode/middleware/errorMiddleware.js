import { MESSAGES } from "../utils/messages.js";
import ApiError from "../utils/apiError.js";

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || MESSAGES.GENERAL.ACTION_FAILED,
    });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: MESSAGES.GENERAL.INVALID_ID,
    });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: MESSAGES.AUTH.TOKEN_INVALID,
      details: "Access token expired. Please refresh your token.",
    });
  }
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: MESSAGES.AUTH.TOKEN_INVALID,
    });
  }
  if (err.name === "MongoNetworkError" || err.code === "ECONNREFUSED") {
    return res.status(500).json({
      success: false,
      message: MESSAGES.GENERAL.DB_CONNECT_ERROR,
    });
  }
  return res.status(500).json({
    success: false,
    message: MESSAGES.GENERAL.SERVER_ERROR,
  });
};
