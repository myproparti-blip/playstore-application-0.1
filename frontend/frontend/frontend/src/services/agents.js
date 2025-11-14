import api from "./axios";


export const getAgents=async()=>{
    try{
        const response=await api.get("/agents");
        return response.data;
    }catch(error){
        console.log("Error fetch agents:",error);
    }
}
export const getAgentById=async(id)=>{
    try{
        const response=await api.get(`/agents/${id}`);
        return response.data;
    }catch(error){
        console.log("Error adding agent:",error);
    }
}
export const addAgent = async (formData) => {
    try {
        const response = await api.post("/agents", formData);
        return response.data;
    } catch (error) {
        console.log("Error adding agent:", error);
        // Return consistent error format
        return { 
            success: false, 
            error: error.response?.data?.message || error.message,
            status: error.response?.status 
        };
    }
}

export const updateAgent = async (id, formData) => {
    try {
        const response = await api.put(`/agents/${id}`, formData);
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.message || error.message,
            status: error.response?.status 
        };
    }
};
export const approveAgent = async (id) => {
  try {
    const { data } = await api.put(`/agents/${id}/approve`);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export const rejectAgent = async (id, rejectionData) => {
  try {
    const { data } = await api.put(`/agents/${id}/reject`, rejectionData);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};
