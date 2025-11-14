import jwt from "jsonwebtoken";
export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "365d" }
  );

  return { accessToken, refreshToken };
};
