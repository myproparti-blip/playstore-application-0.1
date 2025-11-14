import mongoose from "mongoose";
import Agent from "../models/agentModel.js";
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

// ✅ Get all agents
export const getAgents = asyncHandler(async (req, res) => {
  const { operatingCity } = req.query;
  const filter = operatingCity
    ? { operatingCity: { $regex: operatingCity, $options: "i" } }
    : {};
  const baseUrl = getBaseUrl(req);

  const agents = await Agent.find(filter).sort({ createdAt: -1 });
  const agentsWithFullUrls = agents.map((agent) => ({
    ...agent.toObject(),
    image: getFullUrl(agent.image, baseUrl),
    idProof: getFullUrl(agent.idProof, baseUrl),
  }));

  res.status(200).json({
    success: true,
    message: MESSAGES.AGENT.FETCH_SUCCESS,
    data: agentsWithFullUrls,
  });
});

// ✅ Get agent by ID
export const getAgentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const baseUrl = getBaseUrl(req);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(MESSAGES.AGENT.INVALID_ID, 400);
  }

  const agent = await Agent.findById(id);
  if (!agent) throw new ApiError(MESSAGES.AGENT.NOT_FOUND, 404);

  const agentWithFullUrls = {
    ...agent.toObject(),
    image: getFullUrl(agent.image, baseUrl),
    idProof: getFullUrl(agent.idProof, baseUrl),
  };

  res.status(200).json({
    success: true,
    message: MESSAGES.AGENT.FETCH_ONE_SUCCESS,
    data: agentWithFullUrls,
  });
});

// ✅ Add Agent (one per phone number, no overwrite)
export const addAgent = asyncHandler(async (req, res) => {
  const {
    agentName,
    firmName,
    operatingCity,
    operatingAreaChips,
    operatingSince,
    teamMembers,
    dealsIn,
    dealsInOther,
    aboutAgent,
    isPropertyDealer,
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
  const phone = req.user?.phone;
  if (!phone) throw new ApiError("User phone not found", 400);

  // ✅ Check if an agent already exists for this phone
  const existingAgent = await Agent.findOne({ phone });
  if (existingAgent) {
    throw new ApiError("Agent already exists for this phone number", 400);
  }

  if (
    !agentName ||
    !operatingCity ||
    !dealsIn ||
    !req.files?.image?.[0] ||
    !req.files?.idProof?.[0]
  ) {
    throw new ApiError(MESSAGES.AGENT.REQUIRED_FIELDS, 400);
  }

  const imagePath = req.files.image[0].path;
  const idProofPath = req.files.idProof[0].path;

  const formattedDealsIn = Array.isArray(dealsIn)
    ? dealsIn
    : typeof dealsIn === "string"
    ? dealsIn.split(",").map((d) => d.trim())
    : [];

  const formattedDealsInOther = Array.isArray(dealsInOther)
    ? dealsInOther
    : typeof dealsInOther === "string"
    ? dealsInOther.split(",").map((d) => d.trim())
    : [];

  const agent = await Agent.create({
    user: req.user?.id,
    phone,
    agentName: agentName.trim(),
    firmName: firmName?.trim() || "",
    operatingCity: operatingCity.trim(),
    operatingAreaChips: operatingAreaChips || [],
    operatingSince: operatingSince || "",
    teamMembers: teamMembers || 0,
    dealsIn: formattedDealsIn,
    dealsInOther: formattedDealsInOther,
    aboutAgent: aboutAgent?.trim() || "",
    isPropertyDealer:
      isPropertyDealer === "yes" ||
      isPropertyDealer === true ||
      isPropertyDealer === "true"
        ? "yes"
        : "no",
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
    latitude: latitude || null,
    longitude: longitude || null,
  });

  const agentWithFullUrls = {
    ...agent.toObject(),
    image: getFullUrl(imagePath, baseUrl),
    idProof: getFullUrl(idProofPath, baseUrl),
  };

  res.status(201).json({
    success: true,
    message: MESSAGES.AGENT.ADD_SUCCESS,
    data: agentWithFullUrls,
  });
});

export const updateAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const baseUrl = getBaseUrl(req);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(MESSAGES.AGENT.INVALID_ID, 400);
  }

  // Find the agent
  const agent = await Agent.findById(id);
  if (!agent) throw new ApiError(MESSAGES.AGENT.NOT_FOUND, 404);

  // ✅ Only owner or master admin can update
  if (!isMasterAdmin(req) && agent.user?.toString() !== req.user.id) {
    throw new ApiError(MESSAGES.AGENT.NOT_AUTHORIZED, 403);
  }

  const updatableFields = [
    "agentName",
    "firmName",
    "operatingCity",
    "operatingAreaChips",
    "operatingSince",
    "teamMembers",
    "dealsIn",
    "dealsInOther",
    "aboutAgent",
    "isPropertyDealer",
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

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (["dealsIn", "dealsInOther"].includes(field)) {
        agent[field] = Array.isArray(req.body[field])
          ? req.body[field]
          : req.body[field].toString().split(",").map((d) => d.trim());
      } else if (field === "isPropertyDealer") {
        agent.isPropertyDealer =
          req.body[field] === "yes" ||
          req.body[field] === true ||
          req.body[field] === "true"
            ? "yes"
            : "no";
      } else if (typeof req.body[field] === "string") {
        agent[field] = req.body[field].trim();
      } else {
        agent[field] = req.body[field];
      }
    }
  });

  // ✅ Cannot update phone
  if (req.body.phone && req.body.phone !== agent.phone) {
    throw new ApiError("Phone number cannot be updated", 400);
  }

  if (req.files?.image?.[0]) agent.image = req.files.image[0].path;
  if (req.files?.idProof?.[0]) agent.idProof = req.files.idProof[0].path;

  const updated = await agent.save();

  const updatedWithFullUrls = {
    ...updated.toObject(),
    image: getFullUrl(updated.image, baseUrl),
    idProof: getFullUrl(updated.idProof, baseUrl),
  };

  res.status(200).json({
    success: true,
    message: MESSAGES.AGENT.UPDATE_SUCCESS,
    data: updatedWithFullUrls,
  });
});

// ✅ Approve / Reject same as before
export const approveAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isMasterAdmin(req))
    throw new ApiError(MESSAGES.AGENT.NOT_AUTHORIZED, 403);
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(MESSAGES.AGENT.INVALID_ID, 400);

  const agent = await Agent.findById(id);
  if (!agent) throw new ApiError(MESSAGES.AGENT.NOT_FOUND, 404);

  agent.status = "approved";
  agent.rejectedReason = "";
  await agent.save();

  res.status(200).json({
    success: true,
    message: MESSAGES.AGENT.APPROVE_SUCCESS,
    data: agent,
  });
});

export const rejectAgent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!isMasterAdmin(req))
    throw new ApiError(MESSAGES.AGENT.NOT_AUTHORIZED, 403);
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ApiError(MESSAGES.AGENT.INVALID_ID, 400);
  if (!reason || reason.trim() === "")
    throw new ApiError(MESSAGES.AGENT.REJECTION_MESSAGE_REQUIRED, 400);

  const agent = await Agent.findById(id);
  if (!agent) throw new ApiError(MESSAGES.AGENT.NOT_FOUND, 404);

  agent.status = "rejected";
  agent.rejectedReason = reason.trim();
  await agent.save();

  res.status(200).json({
    success: true,
    message: MESSAGES.AGENT.REJECT_SUCCESS,
    data: agent,
  });
});
