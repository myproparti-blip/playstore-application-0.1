export const MESSAGES = {
  AUTH: {
  PHONE_ROLE_REQUIRED: "Phone number and role are required.",
  PHONE_REQUIRED: "Phone number is required.",
  INVALID_PHONE: "Invalid phone number.",
  OTP_SENT: "OTP sent successfully.",
  OTP_FAILED: "Failed to send OTP.",
  OTP_INVALID: "Invalid OTP request.",
  OTP_EXPIRED: "OTP has expired.",
  OTP_INCORRECT: "Incorrect OTP.",
  OTP_RESEND_SUCCESS: "OTP resent successfully.",
  OTP_RESEND_WAIT: "Please wait 30 seconds before resending OTP.",
  OTP_NOT_FOUND: "No OTP request found. Please request a new OTP first.",
  LOGIN_SUCCESS: "Login successful.",
  ADMIN_LOGIN_SUCCESS: "Admin login successful.",
  TOKEN_MISSING: "Authorization token missing.",
  TOKEN_INVALID: "Invalid or expired token.",
  ACCOUNT_DELETED: "Account deleted successfully.",
  USER_NOT_FOUND: "User not found.",
  NOT_AUTHORIZED: "Not authorized to perform this action."
  },

  CONSULTANT: {
  REQUIRED_FIELDS: "Please provide all required consultant details",
  EXISTS: "A consultant with this name and phone number already exists",
  ADD_SUCCESS: "Consultant added successfully",
  ADD_FAIL: "Failed to add consultant",
  UPDATE_SUCCESS: "Consultant updated successfully",
  UPDATE_FAIL: "Failed to update consultant",
  DELETE_SUCCESS: "Consultant deleted successfully",
  DELETE_FAIL: "Failed to delete consultant",
  FETCH_SUCCESS: "Consultants fetched successfully",
  FETCH_ONE_SUCCESS: "Consultant fetched successfully",
  FETCH_FAIL: "Failed to fetch consultants",
  APPROVE_SUCCESS: "Consultant approved successfully",
  REJECT_SUCCESS: "Consultant rejected successfully",
  REJECT_REASON_REQUIRED: "Rejection reason is required",
  INVALID_ID: "Invalid consultant ID",
  INVALID_MONEY_TYPE: "Invalid moneyType. Must be 'minute', 'hour', or 'project'",
  NOT_FOUND: "Consultant not found",
  NOT_AUTHORIZED: "You are not authorized to perform this action",
},

PROPERTY: {
  REQUIRED_FIELDS: "Please provide all required property details",
  ADD_SUCCESS: "Property added successfully",
  ADD_FAIL: "Failed to add property",
  UPDATE_SUCCESS: "Property updated successfully",
  UPDATE_FAIL: "Failed to update property",
  DELETE_SUCCESS: "Property deleted successfully",
  DELETE_FAIL: "Failed to delete property",
  DUPLICATE_FOUND: "Duplicate property found. Existing property updated successfully",
  NOT_FOUND: "Property not found",
  NOT_AUTHORIZED: "Not authorized to perform this action",
  APPROVE_SUCCESS: "Property approved successfully",
  APPROVE_FAIL: "Failed to approve property",
  REJECT_SUCCESS: "Property rejected successfully",
  REJECTION_MESSAGE_REQUIRED: "Rejection message is required",
  FETCH_SUCCESS: "Properties fetched successfully",
  FETCH_FAIL: "Failed to fetch properties",
  FETCH_SINGLE_SUCCESS: "Property details fetched successfully",
   USER_FETCH_SUCCESS: "User properties fetched successfully",
  USER_FETCH_EMPTY: "No properties found for this user",
},


  PAYMENT: {
    ORDER_CREATED: " Payment order created successfully.",
    ORDER_FAILED: "Failed to create payment order.",
    VERIFIED_SUCCESS: "Payment verified successfully.",
    VERIFIED_FAIL: " Payment verification failed.",
  },

AGENT: {
  REQUIRED_FIELDS: "Agent name, dealsIn, and operatingCity are required",
  ADD_SUCCESS: "Agent registered successfully",
  ADD_FAIL: "Failed to register agent",
  UPDATE_SUCCESS: "Agent updated successfully",
  UPDATE_FAIL: "Failed to update agent",
  DELETE_SUCCESS: "Agent deleted successfully",
  DELETE_FAIL: "Failed to delete agent",
  NOT_FOUND: "Agent not found",
  NOT_AUTHORIZED: "Not authorized to perform this action",
  FETCH_SUCCESS: "Agents fetched successfully",
  FETCH_FAIL: "Failed to fetch agents",
  APPROVE_SUCCESS: "Agent approved successfully",
  APPROVE_FAIL: "Failed to approve agent",
  REJECT_SUCCESS: "Agent rejected successfully",
  REJECT_FAIL: "Failed to reject agent",
  REJECTION_MESSAGE_REQUIRED: "Rejection message is required"
},

  GENERAL: {
    SERVER_ERROR: "Internal server error",
    DB_CONNECT_ERROR: "Database connection error",
    INVALID_ID: "Invalid ID provided",
    ACTION_FAILED: "Action failed, please try again"
  },
  ADVERTISEMENT: {
  UPLOAD_IMAGE_SUCCESS: "Advertisement image uploaded successfully",
  UPLOAD_VIDEO_SUCCESS: "Advertisement video uploaded successfully",
  UPLOAD_MULTIPLE_SUCCESS: "Advertisement files uploaded successfully",
  FETCH_SUCCESS: "Advertisements fetched successfully",
  DELETE_SUCCESS: "Advertisement deleted successfully",
  NOT_FOUND: "Advertisement not found"
},
 LOCATION: {
    QUERY_TOO_SHORT: "Query too short",
    LAT_LON_REQUIRED: "Latitude and longitude are required",
    LOCATION_NOT_FOUND: "Location not found",
    FETCH_SUGGESTIONS_FAILED: "Failed to fetch location suggestions",
    FETCH_CURRENT_FAILED: "Failed to fetch current location"
  }
};
