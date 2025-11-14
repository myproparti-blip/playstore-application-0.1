import mongoose from "mongoose";
import consultantModel from "../models/consultantModel.js";
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

export const getConsultants = asyncHandler(async (req, res) => {
  const { location } = req.query;
  const filter = location ? { location: { $regex: location, $options: "i" } } : {};
  const baseUrl = getBaseUrl(req);

  const consultants = await consultantModel.find(filter).sort({ createdAt: -1 });

  const consultantsWithFullUrls = consultants.map((consultant) => ({
    ...consultant.toObject(),
    image: getFullUrl(consultant.image, baseUrl),
    idProof: getFullUrl(consultant.idProof, baseUrl),
  }));

  res.status(200).json({
    success: true,
    message: MESSAGES.CONSULTANT.FETCH_SUCCESS,
    data: consultantsWithFullUrls,
  });
});

export const getConsultantById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const baseUrl = getBaseUrl(req);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(MESSAGES.CONSULTANT.INVALID_ID, 400);
  }

  const consultant = await consultantModel.findById(id);
  if (!consultant) throw new ApiError(MESSAGES.CONSULTANT.NOT_FOUND, 404);

  const consultantWithFullUrls = {
    ...consultant.toObject(),
    image: getFullUrl(consultant.image, baseUrl),
    idProof: getFullUrl(consultant.idProof, baseUrl),
  };

  res.status(200).json({
    success: true,
    message: MESSAGES.CONSULTANT.FETCH_ONE_SUCCESS,
    data: consultantWithFullUrls,
  });
});

export const addConsultant = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    designation,
    experience,
    money,
    moneyType,
    certifications,
    expertise,
    languages,
    address,
    location,
    addressLine1,
    addressLine2,
    landmark,
    locality,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
  } = req.body;

  const baseUrl = getBaseUrl(req);

  if (
    !name ||
    !phone ||
    !designation ||
    experience === undefined ||
    !money ||
    !expertise ||
    !location ||
    !req.files?.image?.[0] ||
    !req.files?.idProof?.[0]
  ) {
    throw new ApiError(MESSAGES.CONSULTANT.REQUIRED_FIELDS, 400);
  }

  if (moneyType && !["minute", "hour", "project"].includes(moneyType)) {
    throw new ApiError(MESSAGES.CONSULTANT.INVALID_MONEY_TYPE, 400);
  }

  // ✅ Allow only one consultant per phone number
  const existing = await consultantModel.findOne({ phone: phone.trim() });
  if (existing) throw new ApiError(MESSAGES.CONSULTANT.EXISTS, 400);

  const imagePath = req.files.image[0].path;
  const idProofPath = req.files.idProof[0].path;

  const formattedLanguages = Array.isArray(languages)
    ? languages
    : typeof languages === "string"
    ? languages.split(",").map((l) => l.trim())
    : [];

  const consultant = await consultantModel.create({
    name: name.trim(),
    phone: phone.trim(),
    designation: designation.trim(),
    experience,
    money,
    moneyType: moneyType || "project",
    expertise: expertise.trim(),
    certifications: certifications?.trim() || "",
    languages: formattedLanguages,
    image: imagePath,
    idProof: idProofPath,
    address: address?.trim() || "",
    location: location?.trim() || "",
    addressLine1: addressLine1?.trim() || "",
    addressLine2: addressLine2?.trim() || "",
    landmark: landmark?.trim() || "",
    locality: locality?.trim() || "",
    city: city?.trim() || "",
    state: state?.trim() || "",
    country: country?.trim() || "India",
    pincode: pincode?.trim() || "",
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    user: req.user?.id || null,
  });

  const consultantWithFullUrls = {
    ...consultant.toObject(),
    image: getFullUrl(imagePath, baseUrl),
    idProof: getFullUrl(idProofPath, baseUrl),
  };

  res.status(201).json({
    success: true,
    message: MESSAGES.CONSULTANT.ADD_SUCCESS,
    data: consultantWithFullUrls,
  });
});


export const updateConsultant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const baseUrl = getBaseUrl(req);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(MESSAGES.CONSULTANT.INVALID_ID, 400);
  }

  const consultant = await consultantModel.findById(id);
  if (!consultant) throw new ApiError(MESSAGES.CONSULTANT.NOT_FOUND, 404);

  // 🔒 Auth check
  if (!isMasterAdmin(req) && consultant.user?.toString() !== req.user.id) {
    throw new ApiError(MESSAGES.CONSULTANT.NOT_AUTHORIZED, 403);
  }

  // 💰 Validate moneyType
  if (req.body.moneyType && !["minute", "hour", "project"].includes(req.body.moneyType)) {
    throw new ApiError(MESSAGES.CONSULTANT.INVALID_MONEY_TYPE, 400);
  }

  // ✅ Allowed updatable fields (no phone!)
  const fields = [
    "name",
    "designation",
    "experience",
    "money",
    "moneyType",
    "expertise",
    "certifications",
    "languages",
    "address",
    "location",
    "addressLine1",
    "addressLine2",
    "landmark",
    "locality",
    "city",
    "state",
    "country",
    "pincode",
    "latitude",
    "longitude",
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === "languages") {
        consultant.languages = Array.isArray(req.body.languages)
          ? req.body.languages
          : req.body.languages.toString().split(",").map((l) => l.trim());
      } else if (["latitude", "longitude"].includes(field)) {
        consultant[field] = Number(req.body[field]);
      } else if (typeof req.body[field] === "string") {
        consultant[field] = req.body[field].trim();
      } else {
        consultant[field] = req.body[field];
      }
    }
  });

  // 📸 File updates
  if (req.files?.image?.[0]) consultant.image = req.files.image[0].path;
  if (req.files?.idProof?.[0]) consultant.idProof = req.files.idProof[0].path;

  const updated = await consultant.save();

  const updatedWithFullUrls = {
    ...updated.toObject(),
    image: getFullUrl(updated.image, baseUrl),
    idProof: getFullUrl(updated.idProof, baseUrl),
  };

  res.status(200).json({
    success: true,
    message: MESSAGES.CONSULTANT.UPDATE_SUCCESS,
    data: updatedWithFullUrls,
  });
});



export const approveConsultant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isMasterAdmin(req)) {
    throw new ApiError(MESSAGES.CONSULTANT.NOT_AUTHORIZED, 403);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(MESSAGES.CONSULTANT.INVALID_ID, 400);
  }

  const consultant = await consultantModel.findById(id);
  if (!consultant) throw new ApiError(MESSAGES.CONSULTANT.NOT_FOUND, 404);

  consultant.status = "approved";
  consultant.rejectedReason = "";
  await consultant.save();

  res.status(200).json({
    success: true,
    message: MESSAGES.CONSULTANT.APPROVE_SUCCESS,
    data: consultant,
  });
});

export const rejectConsultant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!isMasterAdmin(req)) {
    throw new ApiError(MESSAGES.CONSULTANT.NOT_AUTHORIZED, 403);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(MESSAGES.CONSULTANT.INVALID_ID, 400);
  }

  if (!reason || reason.trim() === "") {
    throw new ApiError(MESSAGES.CONSULTANT.REJECT_REASON_REQUIRED, 400);
  }

  const consultant = await consultantModel.findById(id);
  if (!consultant) throw new ApiError(MESSAGES.CONSULTANT.NOT_FOUND, 404);

  consultant.status = "rejected";
  consultant.rejectedReason = reason.trim();
  await consultant.save();

  res.status(200).json({
    success: true,
    message: MESSAGES.CONSULTANT.REJECT_SUCCESS,
    data: consultant,
  });
});
