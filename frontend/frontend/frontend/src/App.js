import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { TabBar, Toast } from "antd-mobile";
import {
  AppOutline,
  UserOutline,
  UnorderedListOutline,
  SetOutline,
} from "antd-mobile-icons";
import "antd-mobile/es/global";
import api from "./services/axios";

// ===== PAGES =====
import Home from "./pages/home";
import BookConsultant from "./pages/BookConsultant";
import PropertyListing from "./pages/PropertyListing";
import Login from "./pages/login";
import PostProperty from "./components/proparti/PostProperty";
import Management from "./pages/Management";
import MyProperties from "./components/proparti/MyProperties";
import PropertyDetails from "./components/proparti/PropertyDetails";
import Profile from "./components/profile/Profile";
import Favorites from "./components/profile/Favorites";
import MyConsultants from "./components/consultant/MyConsultants";
import MyAgents from "./components/proparti/agenData";

// ===== STYLE =====
const MOBILE_MAX_WIDTH = "500px";
const appContainerStyle = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  width: "100%",
  maxWidth: MOBILE_MAX_WIDTH,
  margin: "0 auto",
  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  position: "relative",
  overflow: "hidden",
  backgroundColor: "#000000ff",
};

// ===== Main Tab Routes =====
const mainTabRoutes = ["/home", "/BookConsultant", "/PropertyListing", "/Management"];

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [transparent, setTransparent] = useState(true);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // ===== Determine active tab =====
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/" || path === "/home") return "home";
    if (path.startsWith("/BookConsultant")) return "BookConsultant";
    if (path.startsWith("/PropertyListing")) return "PropertyListing";
    if (path.startsWith("/Management")) return "Management";
    return "home";
  };
  const activeTab = getActiveTab();

  // ===== Track Navigation State =====
  useEffect(() => {
    const isMainTab = mainTabRoutes.includes(location.pathname);
    
    // Send navigation state to React Native
    const navigationState = {
      canGoBack: false,
      currentPath: location.pathname,
      isMainTab: isMainTab
    };
    
    sendToReactNative({
      type: "NAVIGATION_STATE",
      payload: navigationState
    });
    
    console.log("📍 Current Path:", location.pathname, "Main Tab:", isMainTab);
  }, [location]);

  // ===== Send message to React Native =====
  const sendToReactNative = (data) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  };

  // ===== Handle messages from React Native =====
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === "NAVIGATE_TO" && data.payload.path) {
          // Navigate to the specified path
          navigate(data.payload.path);
        } else if (data.type === "GO_BACK") {
          // For GO_BACK, always navigate to home
          navigate("/home");
        }
      } catch (error) {
        console.log("Error handling message from React Native:", error);
      }
    };

    // Listen for messages from React Native
    document.addEventListener("message", handleMessage);
    window.addEventListener("message", handleMessage);

    return () => {
      document.removeEventListener("message", handleMessage);
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]);

  // ===== Check Token & Auto Login =====
  const refreshSession = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return false;

      const { data } = await api.post("/auth/refresh", { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = data;

      if (!accessToken || !newRefreshToken) return false;

      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      return true;
    } catch (err) {
      console.warn("Session refresh failed:", err.message);
      return false;
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const accessToken = localStorage.getItem("authToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken && !refreshToken) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      try {
        // Attempt silent refresh first
        const ok = await refreshSession();
        if (ok) setLoggedIn(true);
        else setLoggedIn(false);
      } catch {
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  // ===== Persist login state =====
  useEffect(() => {
    localStorage.setItem("loggedIn", loggedIn ? "true" : "false");
  }, [loggedIn]);

  // ===== Logout =====
  const handleLogout = () => {
    localStorage.clear();
    setLoggedIn(false);
    Toast.show({ content: "Logged out successfully!", icon: "success" });
  };

  // ===== Tab configuration =====
  const tabs = [
    { key: "home", icon: <AppOutline />, title: "Home", path: "/home" },
    {
      key: "BookConsultant",
      icon: <UserOutline />,
      title: "Book Consultant",
      path: "/BookConsultant",
    },
    {
      key: "PropertyListing",
      icon: <UnorderedListOutline />,
      title: "Property Listing",
      path: "/PropertyListing",
    },
    {
      key: "Management",
      icon: <SetOutline />,
      title: "Property Management",
      path: "/Management",
    },
  ];

  // ===== Handle Tab Change =====
  const handleTabChange = (key) => {
    const tab = tabs.find((t) => t.key === key);
    if (tab && location.pathname !== tab.path) {
      navigate(tab.path);
    }
    setTransparent(false);
    setTimeout(() => setTransparent(true), 300);
  };

  

  // ===== Login Check =====
  if (!loggedIn)
    return <Login onLoginSuccess={() => setLoggedIn(true)} />;

  // ===== MAIN APP =====
  return (
    <div style={appContainerStyle}>
      {/* MAIN CONTENT */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          width: "100%",
          WebkitOverflowScrolling: "touch",
           overscrollBehavior: "contain",
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/BookConsultant" element={<BookConsultant />} />
          <Route path="/PropertyListing" element={<PropertyListing />} />
          <Route path="/Management" element={<Management />} />
          <Route path="/post-property" element={<PostProperty />} />
          <Route path="/profile/:id" element={<BookConsultant />} />
          <Route path="/PropertyDetails/:id" element={<PropertyDetails />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/my-properties" element={<MyProperties />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile onLogout={handleLogout} />} />
          <Route path="/MyConsultants" element={<MyConsultants />} />
          <Route path="/agentData" element={<MyAgents />} />
        </Routes>
      </div>

      {/* TAB BAR */}
      <div
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
          backgroundColor: transparent
            ? "rgba(255, 255, 255, 0.6)"
            : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          transition: "all 0.4s ease",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <TabBar activeKey={activeTab} onChange={handleTabChange}>
          {tabs.map((item) => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  );
}