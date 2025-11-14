// src/services/properties.js
import api from "./axios";
export const getProperties = async () => {
  try {
    const { data } = await api.get("/properties");
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

// In services/properties.js - enhance error handling
export const getPropertyById = async (id) => {
  try {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  } catch (error) {
    console.error('API Error fetching property:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to fetch property' 
    };
  }
};
export const createProperty = async (propertyData) => {
  try {
    const { data } = await api.post("/properties", propertyData, {
      headers: {
        "Content-Type": "multipart/form-data" 
      }
    });
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export const updateProperty = async (id, propertyData) => {
  try {
    const { data } = await api.put(`/properties/${id}`, propertyData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export const deleteProperty = async (id) => {
  try {
    const { data } = await api.delete(`/properties/${id}`);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export const searchProperties = async (filters) => {
  try {
    const { data } = await api.get("/properties/search", { params: filters });
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export const getFeaturedProperties = async () => {
  try {
    const { data } = await api.get("/properties/featured");
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export const toggleFavorite = async (propertyId) => {
  try {
    const { data } = await api.post(`/properties/${propertyId}/favorite`);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export const getFavoriteProperties = async () => {
  try {
    const { data } = await api.get("/properties/favorites");
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export const getOwnProperties=async()=>{
 try {
    const { data } = await api.get("/properties/my-properties");
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};
export const approveProperty = async (propertyId) => {
  try {
    const { data } = await api.put(`/properties/${propertyId}/approve`);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};
export const rejectProperty = async (propertyId, rejectionMessage) => {
  try {
    const { data } = await api.put(`/properties/${propertyId}/reject`, { rejectionMessage });
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};