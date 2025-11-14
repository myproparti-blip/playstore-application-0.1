import Property from "../models/propertyModel.js";
import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { MESSAGES } from "../utils/messages.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isMasterAdmin = (req) => req.user?.phone === process.env.ADMIN_PHONE;

const getBaseUrl = (req) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}`;
};

export const createProperty = asyncHandler(async (req, res) => {
  const { title, propertyType, addressLine1, city, price, bedrooms } = req.body;

  if (!title || !addressLine1 || !city || !propertyType || !price || !bedrooms) {
    throw new ApiError(MESSAGES.PROPERTY.REQUIRED_FIELDS, 400);
  }

  const uploadedImages = req.files?.images?.map((file) => file.path) || [];
  const uploadedVideos = req.files?.videos?.map((file) => file.path) || [];

  const newProperty = new Property({
    ...req.body,
    user: req.user.id,
    images: uploadedImages,
    videos: uploadedVideos,
    isApproved: false,
  });

  const saved = await newProperty.save();

  res.status(201).json({
    success: true,
    message: MESSAGES.PROPERTY.ADD_SUCCESS,
    data: saved,
  });
});

export const getAllProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find().populate("user", "name email phoneNumber");

  const propertiesWithUrls = properties.map((prop) => ({
    ...prop.toObject(),
    images: prop.images.map((url) =>
      url.startsWith("http") ? url : `${getBaseUrl(req)}${url}`
    ),
    videos: prop.videos.map((url) =>
      url.startsWith("http") ? url : `${getBaseUrl(req)}${url}`
    ),
  }));

  res.status(200).json({
    success: true,
    message: MESSAGES.PROPERTY.FETCH_SUCCESS,
    data: propertiesWithUrls,
  });
});

export const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate(
    "user",
    "name email phoneNumber"
  );
  if (!property) throw new ApiError(MESSAGES.PROPERTY.NOT_FOUND, 404);

  const baseUrl = getBaseUrl(req);
  const propertyWithUrls = {
    ...property.toObject(),
    images: property.images.map((url) =>
      url.startsWith("http") ? url : `${baseUrl}${url}`
    ),
    videos: property.videos.map((url) =>
      url.startsWith("http") ? url : `${baseUrl}${url}`
    ),
  };

  res.status(200).json({
    success: true,
    message: MESSAGES.PROPERTY.FETCH_SINGLE_SUCCESS,
    data: propertyWithUrls,
  });
});

export const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new ApiError(MESSAGES.PROPERTY.NOT_FOUND, 404);

  const isAdmin = isMasterAdmin(req);
  if (property.user.toString() !== req.user.id && !isAdmin) {
    throw new ApiError(MESSAGES.PROPERTY.NOT_AUTHORIZED, 403);
  }

  const newImages = req.files?.images?.map((file) => file.path) || [];
  const newVideos = req.files?.videos?.map((file) => file.path) || [];

  property.images.push(...newImages);
  property.videos.push(...newVideos);
  Object.assign(property, req.body, { lastUpdated: Date.now() });

  const updated = await property.save();

  res.status(200).json({
    success: true,
    message: MESSAGES.PROPERTY.UPDATE_SUCCESS,
    data: updated,
  });
});

export const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new ApiError(MESSAGES.PROPERTY.NOT_FOUND, 404);

  const isAdmin = isMasterAdmin(req);
  if (property.user.toString() !== req.user.id && !isAdmin) {
    throw new ApiError(MESSAGES.PROPERTY.NOT_AUTHORIZED, 403);
  }

  await property.deleteOne();

  res.status(200).json({
    success: true,
    message: MESSAGES.PROPERTY.DELETE_SUCCESS,
  });
});

export const approveProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) throw new ApiError(MESSAGES.PROPERTY.NOT_FOUND, 404);

  const isAdmin = isMasterAdmin(req);
  if (!isAdmin) throw new ApiError(MESSAGES.PROPERTY.NOT_AUTHORIZED, 403);

  property.isApproved = true;
  property.isRejected = false;
  property.rejectionMessage = "";
  property.approvedBy = req.user.id;
  property.approvalDate = Date.now();

  const updated = await property.save();

  res.status(200).json({
    success: true,
    message: MESSAGES.PROPERTY.APPROVE_SUCCESS,
    data: updated,
  });
});

export const rejectProperty = asyncHandler(async (req, res) => {
  const { rejectionMessage } = req.body;

  const property = await Property.findById(req.params.id);
  if (!property) throw new ApiError(MESSAGES.PROPERTY.NOT_FOUND, 404);

  if (!isMasterAdmin(req)) {
    throw new ApiError(MESSAGES.PROPERTY.NOT_AUTHORIZED, 403);
  }

  if (!rejectionMessage || rejectionMessage.trim() === "") {
    throw new ApiError(MESSAGES.PROPERTY.REJECTION_MESSAGE_REQUIRED, 400);
  }

  property.isApproved = false;
  property.isRejected = true;
  property.rejectionMessage = rejectionMessage.trim();
  property.rejectedBy = req.user.id;
  property.rejectionDate = Date.now();

  const updated = await property.save();
  res.status(200).json({
    success: true,
    message: MESSAGES.PROPERTY.REJECT_SUCCESS,
    data: updated,
  });
});
export const getUserProperties = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userProperties = await Property.find({ user: userId })
    .populate("user", "name email phoneNumber");

  if (!userProperties || userProperties.length === 0) {
    return res.status(200).json({
      success: true,
      message: MESSAGES.PROPERTY.FETCH_FAIL, 
      data: [],
    });
  }
  const baseUrl = getBaseUrl(req);
  const formattedProperties = userProperties.map((prop) => ({
    ...prop.toObject(),
    images: prop.images.map((url) =>
      url.startsWith("http") ? url : `${baseUrl}${url}`
    ),
    videos: prop.videos.map((url) =>
      url.startsWith("http") ? url : `${baseUrl}${url}`
    ),
  }));
  res.status(200).json({
    success: true,
    message: MESSAGES.PROPERTY.FETCH_SUCCESS, 
    data: formattedProperties,
  });
});
