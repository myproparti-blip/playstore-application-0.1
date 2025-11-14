import Advertisement from "../models/Advertisement.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { MESSAGES } from "../utils/messages.js";

const isMasterAdmin = (req) => req.user?.phone === process.env.ADMIN_PHONE;
const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;
const getFullUrl = (path, baseUrl) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};
export const uploadImage = asyncHandler(async (req, res) => {
  if (!isMasterAdmin(req)) throw new ApiError(MESSAGES.AUTH.NOT_AUTHORIZED, 403);
  if (!req.file) throw new ApiError("No image file provided", 400);

  const { position, pageKey } = req.body;
  const newAd = await Advertisement.create({
    url: req.file.path,
    public_id: req.file.filename,
    type: "image",
    position: Number(position) || 0,
    pageKey: pageKey || "default",
  });

  res.status(201).json({
    success: true,
    message: MESSAGES.ADVERTISEMENT.UPLOAD_IMAGE_SUCCESS,
    data: newAd,
  });
});

export const uploadVideo = asyncHandler(async (req, res) => {
  if (!isMasterAdmin(req)) throw new ApiError(MESSAGES.AUTH.NOT_AUTHORIZED, 403);
  if (!req.file) throw new ApiError("No video file provided", 400);

  const { position, pageKey } = req.body;

  const newAd = await Advertisement.create({
    url: req.file.path,
    public_id: req.file.filename,
    type: "video",
    position: Number(position) || 0,
    pageKey: pageKey || "default",
  });

  res.status(201).json({
    success: true,
    message: MESSAGES.ADVERTISEMENT.UPLOAD_VIDEO_SUCCESS,
    data: newAd,
  });
});

export const uploadMultiple = asyncHandler(async (req, res) => {
  if (!isMasterAdmin(req)) throw new ApiError(MESSAGES.AUTH.NOT_AUTHORIZED, 403);
  if (!req.files || req.files.length === 0)
    throw new ApiError("No files provided", 400);

  const { position, pageKey } = req.body;

  // Create one record that contains all uploaded files
  const filesData = req.files.map((file) => ({
    url: file.path,
    public_id: file.filename,
    type: file.mimetype.startsWith("video/") ? "video" : "image",
  }));

  const newAd = await Advertisement.create({
    type: "multiple",
    position: Number(position) || 0,
    pageKey: pageKey || "default",
    files: filesData,
  });

  res.status(201).json({
    success: true,
    message: MESSAGES.ADVERTISEMENT.UPLOAD_MULTIPLE_SUCCESS,
    data: newAd,
  });
});


// In advertisementController.js - Update getAllAdvertisements
export const getAllAdvertisements = asyncHandler(async (req, res) => {
  const filter = {};
  
  // Add both pageKey filter if provided
  if (req.query.pageKey) {
    filter.pageKey = req.query.pageKey;
  }
  
  // You can also add position filter if needed
  if (req.query.position !== undefined) {
    filter.position = Number(req.query.position);
  }

  const ads = await Advertisement.find(filter).sort({ createdAt: -1 });
  const baseUrl = getBaseUrl(req);

  const adsWithFullUrl = ads.map((ad) => {
    const adObj = ad.toObject();
    
    // Convert main URL
    adObj.url = getFullUrl(adObj.url, baseUrl);
    
    // Convert URLs in files array for multiple type
    if (adObj.type === "multiple" && adObj.files) {
      adObj.files = adObj.files.map(file => ({
        ...file,
        url: getFullUrl(file.url, baseUrl)
      }));
    }
    
    return adObj;
  });

  res.status(200).json({
    success: true,
    message: MESSAGES.ADVERTISEMENT.FETCH_SUCCESS,
    data: adsWithFullUrl,
  });
});
export const deleteAdvertisement = asyncHandler(async (req, res) => {
  if (!isMasterAdmin(req)) throw new ApiError(MESSAGES.AUTH.NOT_AUTHORIZED, 403);

  const ad = await Advertisement.findById(req.params.id);
  if (!ad) throw new ApiError(MESSAGES.ADVERTISEMENT.NOT_FOUND, 404);

  await ad.deleteOne();
  res.status(200).json({
    success: true,
    message: MESSAGES.ADVERTISEMENT.DELETE_SUCCESS,
  });
});