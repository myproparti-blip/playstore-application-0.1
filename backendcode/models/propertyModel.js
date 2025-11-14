import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },

    propertyType: {
      type: String,
      enum: [
        "Apartment", "Studio", "Independent House", "Villa", "Plot",
        "Commercial Office", "Commercial Shop", "Warehouse", "Industrial Land", "Farmhouse"
      ],
      required: true
    },
    listingType: { type: String, enum: ["Sale", "Rent", "Lease"], required: true },

    bedrooms: {
      type: String,
      enum: [
        "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "6 BHK+", "Studio", "Independent Floor"
      ]
    },

    postedBy: {
      type: String,
      enum: [
        "buyer", "seller", "tenant", "landlord", "owner", "investor", "agent", "broker", 
        "builder", "developer", "contractor", "property_manager", "appraiser", "consultant"
      ],
      default: "owner"
    },

    price: { type: Number, required: true },
    negotiable: { type: Boolean, default: false },
    deposit: { type: Number },
    maintenance: { type: Number },
    maintenanceIncludes: { type: [String] },
    brokerage: { type: Number },

    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    landmark: { type: String },
    locality: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: "India" },
    pincode: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },

    carpetArea: { type: Number },
    builtUpArea: { type: Number },
    superBuiltUpArea: { type: Number },
    plotArea: { type: Number },
    plotWidth: { type: Number },
    plotLength: { type: Number },
    floorNumber: { type: Number },
    totalFloors: { type: Number },
    buildingName: { type: String },
    societyName: { type: String },
    constructionStatus: {
      type: String,
      enum: ["Ready to Move", "Under Construction", "New", "Resale"],
      default: "Resale"
    },
    propertyAgeYears: { type: Number },
    furnishing: { type: String, enum: ["Unfurnished", "Semi-Furnished", "Furnished"] },
    furnishingDetails: { type: [String] }, 
    flooring: { type: String },
    interiors: { type: [String] }, 
    facing: { type: String, enum: ["East","West","North","South","North-East","North-West","South-East","South-West"] },
    view: { type: String }, 

    amenities: [{
      type: String,
      enum: [
        "Lift", "Power Backup", "Visitor Parking", "Security", "Gated Community",
        "Club House", "Gym", "Swimming Pool", "Children's Play Area", "Jogging Track",
        "Indoor Games", "Banquet Hall", "Car Parking", "Wi-Fi", "Fire Safety",
        "Garden/Park", "Community Hall", "24x7 Water Supply", "Intercom", "Shopping Center"
      ]
    }],

    amenitiesDetails: [{ type: String }], 
    parking: { type: Number, default: 0 },
    parkingType: { type: String, enum: ["Covered", "Open", "Basement", "Street"] },
    powerBackup: { type: Boolean, default: false },
    waterSupply: { type: String, enum: ["Corporation", "Borewell", "Tank", "Both"] },
    security: { type: Boolean, default: false },
    gatedCommunity: { type: Boolean, default: false },

    nearbyPlaces: { type: [String] }, 

    propertyDocuments: {
      occupancyCertificate: { type: Boolean, default: false },
      approvalFrom: { type: String },
      propertyTaxPaid: { type: Boolean, default: false }
    },

    images: [{ type: String }],
    videos: [{ type: String }],
    floorPlanFiles: [{ type: String }],
    
    status: { type: String, enum: ["Available", "Sold", "Rented"], default: "Available" },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvalDate: { type: Date },
    datePosted: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now },

    viewsCount: { type: Number, default: 0 },
    favouritesCount: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5 },

    sellerName: { type: String },
    sellerPhone: { type: String },
    sellerEmail: { type: String },
    isVerifiedSeller: { type: Boolean, default: false },
     isRejected: { type: Boolean, default: false },
    rejectionMessage: { type: String, default: "" },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionDate: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Property", propertySchema);
