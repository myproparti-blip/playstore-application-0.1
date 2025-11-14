import React, { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Card,
  Button,
  Toast,
  Avatar,
  Popup,
  SpinLoading,
  Space,
  List,
  Badge,
} from "antd-mobile";
import {
  UserOutline,
  PhoneFill,
  EnvironmentOutline,
  EditSOutline,
  DeleteOutline,
  StarFill,
  TeamOutline,
  ShopbagOutline,
} from "antd-mobile-icons";
import { getConsultants } from "../services/consultants";
import { getProperties } from "../services/properties";
import { deleteProfile, getProfile } from "../services/auth";
import AddConsultantModal from "../components/consultantComponent";
import AgentRegistration from "../components/agentComponent";
import { useNavigate } from "react-router-dom";
import HeaderWithSearch from "../components/common/HeaderWithSearch";
import PostProperty from "../components/postComponent";

// NEW: Import AdvertisementManager
import AdvertisementManager from "../components/common/AdvertisementManager";
import { advertisementService } from "../services/advertise";

// Location detection
const getCurrentCity = () => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const city = data.city || data.locality || 'Surat';
            resolve(city);
          } catch (error) {
            console.error('Error getting location:', error);
            resolve('Surat');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve('Surat');
        },
        { timeout: 10000 }
      );
    } else {
      resolve('Surat');
    }
  });
};

// Format price to Indian format
const formatPrice = (price) => {
  if (!price || price === 'undefined' || price === 'null') return 'Price on request';
  const numPrice = typeof price === 'string' ? parseInt(price.replace(/[^0-9]/g, '')) : price;
  if (numPrice >= 10000000) return `₹${(numPrice / 10000000).toFixed(2)} Cr`;
  if (numPrice >= 100000) return `₹${(numPrice / 100000).toFixed(2)} L`;
  return `₹${numPrice.toLocaleString()}`;
};

// Format consultation fee without time
const formatConsultationFee = (fee) => {
  if (!fee || fee === 'undefined' || fee === 'null') return `₹500`;
  const cleanFee = typeof fee === 'string' ? fee.replace(/[^0-9]/g, '') : fee;
  return `₹${cleanFee}`;
};

// Format languages (first 3 letters)
const formatLanguages = (languages) => {
  if (!languages || languages.length === 0) return ['ENG'];

  let languageArray = [];
  if (Array.isArray(languages)) {
    languageArray = languages;
  } else if (typeof languages === 'string') {
    languageArray = languages.split(',').map(lang => lang.trim());
  }

  return languageArray.slice(0, 3).map(lang => {
    const cleanLang = String(lang).replace(/[^a-zA-Z]/g, '');
    return cleanLang.substring(0, 3).toUpperCase();
  });
};

// Extract only city name from location
const extractCityOnly = (location) => {
  if (!location) return 'City';

  const locationStr = String(location);

  // Remove state names and other parts, keep only city
  const cityOnly = locationStr
    .replace(/(Gujarat|Maharashtra|Gujrat|Mharat|MH|GJ|,\s*[A-Za-z]+)/gi, '')
    .replace(/,,/g, ',')
    .replace(/,$/, '')
    .trim();

  return cityOnly || 'City';
};

// Enhanced image URL handler with proper backend binding
const BASE_URL = "http://192.168.29.78:5000";

const getSafeImageUrl = (imageUrl) => {
  if (!imageUrl) return null;

  imageUrl = imageUrl.trim();

  // Already full URL?
  if (imageUrl.startsWith("http")) return imageUrl;

  // Ensure path starts with /
  if (!imageUrl.startsWith("/")) {
    imageUrl = `/uploads/${imageUrl}`;
  }

  return `${BASE_URL}${imageUrl}`;
};

// Image component with proper error handling
const ImageWithFallback = ({ src, alt, className, type = 'consultant', onClick }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    console.log(`Image failed to load: ${src}`);
    setHasError(true);
    setImgSrc(null);
  };

  const handleLoad = () => {
    console.log(`Image loaded successfully: ${src}`);
    setHasError(false);
  };

  if (hasError || !imgSrc) {
    return (
      <div className={`image-fallback ${className}`} onClick={onClick}>
        <div className="fallback-content">
          {type === 'consultant' ? (
            <UserOutline className="fallback-icon" />
          ) : (
            <ShopbagOutline className="fallback-icon" />
          )}
          <span className="fallback-text">
            {type === 'consultant' ? 'Consultant' : 'Property'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
      onClick={onClick}
    />
  );
};

export default function Home() {
  const [city, setCity] = useState("Detecting...");
  const [consultants, setConsultants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const navigate = useNavigate();

  // Role-based modal states
  const [consultantFormVisible, setConsultantFormVisible] = useState(false);
  const [agentFormVisible, setAgentFormVisible] = useState(false);
  const [postPropertyVisible, setPostPropertyVisible] = useState(false);
  const [hasFilledForm, setHasFilledForm] = useState(false);

  // NEW: Advertisement states
  const [advertisements, setAdvertisements] = useState([]);
  const [adLoading, setAdLoading] = useState(false);

  // Admin Check
  const isAdmin = profile?.phone === process.env.REACT_APP_ADMIN_PHONE;

  // Filter data based on search query
  const filteredConsultants = useMemo(() => {
    if (!searchQuery.trim()) return consultants;

    const query = searchQuery.toLowerCase().trim();
    return consultants.filter(consultant => {
      return (
        (consultant.name && consultant.name.toLowerCase().includes(query)) ||
        (consultant.type && consultant.type.toLowerCase().includes(query)) ||
        (consultant.location && consultant.location.toLowerCase().includes(query)) ||
        (consultant.languages && consultant.languages.some(lang =>
          lang.toLowerCase().includes(query)
        ))
      );
    });
  }, [consultants, searchQuery]);

  const filteredProperties = useMemo(() => {
    if (!searchQuery.trim()) return properties;

    const query = searchQuery.toLowerCase().trim();
    return properties.filter(property => {
      return (
        (property.title && property.title.toLowerCase().includes(query)) ||
        (property.location && property.location.toLowerCase().includes(query)) ||
        (property.city && property.city.toLowerCase().includes(query)) ||
        (property.bhk && property.bhk.toLowerCase().includes(query)) ||
        (property.listingType && property.listingType.toLowerCase().includes(query)) ||
        (property.formattedPrice && property.formattedPrice.toLowerCase().includes(query))
      );
    });
  }, [properties, searchQuery]);

  // NEW: Fetch advertisements function
  const fetchAdvertisements = async () => {
    try {
      setAdLoading(true);
      // Use "home" as the unique key for home page advertisements
      // Change this line in fetchAdvertisements function:
      const response = await advertisementService.getAllAdvertisements("home"); if (response.data.success) {
        setAdvertisements(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching advertisements:", error);
    } finally {
      setAdLoading(false);
    }
  };

  const fetchConsultants = async () => {
    try {
      const res = await getConsultants();
      console.log("Consultants API Response:", res);

      if (res.success) {
        const dataArray = Array.isArray(res.data) ? res.data : res.data?.data || [];

        // Filter only approved consultants
        const approvedConsultants = dataArray.filter(consultant =>
          consultant.status === 'approved'
        );

        const enhancedConsultants = approvedConsultants.map(consultant => {
          const rawExperience = consultant.experience || consultant.Exp || consultant.exp || 0;
          const cleanExperience = parseInt(String(rawExperience).replace(/[^0-9]/g, "")) || 0;

          const rawFee = consultant.money || consultant.fee || consultant.consultationFee || consultant.charges || 0;
          const cleanFee = parseInt(String(rawFee).replace(/[^0-9]/g, "")) || 0;

          return {
            ...consultant,
            id: consultant._id || consultant.id,
            name: consultant.name || consultant.fullName || 'Consultant',
            languages: consultant.languages || ['English'],
            type: consultant.designation || consultant.type || 'General Consultant',
            location: extractCityOnly(consultant.city || consultant.locality),
            image: getSafeImageUrl(consultant.image || consultant.profileImage, 'consultant'),
            formattedExperience: `${cleanExperience} yrs`,
            formattedFee: `₹${cleanFee}/hour`,
          };
        });

        setConsultants(enhancedConsultants);
        return enhancedConsultants;
      }
      return [];
    } catch (e) {
      console.log("Error fetching consultants:", e);
      return [];
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await getProperties();
      console.log("Properties API Response:", res);

      if (res.success) {
        const dataArray = Array.isArray(res.data) ? res.data : res.data?.data || [];

        // Filter only approved properties
        const approvedProperties = dataArray.filter(property =>
          property.isApproved === true
        );

        const enhancedProperties = approvedProperties.map(property => {
          const price = property.price || property.expectedPrice;
          const bedrooms = property.bedrooms || property.bhk || '2';
          const location = extractCityOnly([property.locality, property.city].filter(Boolean).join(', '));

          let imageUrl = null;
          if (property.images && Array.isArray(property.images) && property.images.length > 0) {
            imageUrl = getSafeImageUrl(property.images[0], 'property');
          } else if (property.image) {
            imageUrl = getSafeImageUrl(property.image, 'property');
          }

          return {
            ...property,
            id: property._id || property.id,
            bhk: `${bedrooms} BHK`,
            area: property.carpetArea ? `${property.carpetArea} sq.ft` : '1000 sq.ft',
            location: location,
            image: imageUrl,
            formattedPrice: formatPrice(price),
            listingType: property.listingType || property.type || 'Sale',
            hasImage: !!imageUrl,
            title: property.title || property.propertyType || 'Property'
          };
        });

        setProperties(enhancedProperties);
        return enhancedProperties;
      }
      return [];
    } catch (e) {
      console.log("Error fetching properties:", e);
      return [];
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      if (res.success) {
        setProfile(res.data.user);
        return res.data.user;
      }
    } catch (e) {
      console.log("Profile fetch error:", e);
    }
    return null;
  };

  const detectCity = async () => {
    const detectedCity = await getCurrentCity();
    setCity(detectedCity);
  };

  const checkFormCompletion = async (userProfile) => {
    try {
      if (!userProfile) return;

      const userRoles = userProfile.role || [];
      const userId = userProfile._id;
      const hasFilled = localStorage.getItem(`form_filled_${userId}`);

      const isConsultant = userRoles.includes('consultant');
      const isAgent = userRoles.includes('agent');
      const isOwner = userRoles.includes('owner');
      const isSeller = userRoles.includes('seller');

      if (!hasFilled) {
        if (isConsultant) {
          setConsultantFormVisible(true);
        } else if (isAgent) {
          setAgentFormVisible(true);
        } else if (isOwner || isSeller) {
          setPostPropertyVisible(true);
          localStorage.setItem(`form_filled_${userId}`, "true");
          setHasFilledForm(true);
        }
      } else {
        setHasFilledForm(true);
      }
    } catch (error) {
      console.log("Error checking form completion:", error);
    }
  };

  // Get first 9 items for 3x3 grid
  const getFirstNine = (array) => array.slice(0, 9);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await detectCity();
        const [consultantsData, propertiesData, userProfile] = await Promise.all([
          fetchConsultants(),
          fetchProperties(),
          fetchProfile()
        ]);

        if (userProfile) {
          await checkFormCompletion(userProfile);
        }

        // NEW: Fetch advertisements
        await fetchAdvertisements();

      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Handle form submission success
  const handleFormSuccess = () => {
    if (profile?._id) {
      localStorage.setItem(`form_filled_${profile._id}`, "true");
      setHasFilledForm(true);
    }

    setConsultantFormVisible(false);
    setAgentFormVisible(false);
    setPostPropertyVisible(false);

    fetchConsultants();
    fetchProperties();

    Toast.show({
      icon: "success",
      content: "Profile information saved successfully!"
    });
  };

  // Handle cancel button click
  const handleCancelClick = () => {
    setConsultantFormVisible(false);
    setAgentFormVisible(false);
    setPostPropertyVisible(false);
  };

  // Handle consultant card click
  const handleConsultantClick = (consultantId) => {
    if (consultantId) {
      navigate(`/BookConsultant`);
    } else {
      Toast.show({
        icon: 'fail',
        content: 'Consultant ID not found'
      });
    }
  };

  // Handle property card click
  const handlePropertyClick = (propertyId) => {
    if (propertyId) {
      navigate(`/PropertyListing`);
    } else {
      Toast.show({
        icon: 'fail',
        content: 'Property ID not found'
      });
    }
  };

  // Handle search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Property Management Data
  const propertyManagementData = [
    {
      id: 1,
      title: "Rental Management",
      description: "Complete rental property management",
      price: "₹2,000/month",
      type: "Rental",
    },
    {
      id: 2,
      title: "Maintenance Services",
      description: "Regular maintenance services",
      price: "₹1,500/month",
      type: "Maintenance",
    },
    {
      id: 3,
      title: "Tenant Services",
      description: "Professional tenant management",
      price: "₹3,000/month",
      type: "Tenant",
    },
    {
      id: 4,
      title: "Consultant Management",
      description: "Complete rental property management",
      price: "₹2,000/month",
      type: "Rental",
    },
    {
      id: 5,
      title: " Tenant Services",
      description: "Regular maintenance services",
      price: "₹1,500/month",
      type: "Maintenance",
    },
    {
      id: 6,
      title: "Maintenance Services",
      description: "Professional tenant management",
      price: "₹3,000/month",
      type: "Tenant",
    }
  ];

  // Handle navigation to tabs
  const handleNavigateToTab = (tabName) => {
    console.log("Navigating to:", tabName);
    navigate(`/${tabName}`);
  };

  return (
    <div className="home-container">
      {/* Background Image */}
      <div className="property-background-image"></div>

      {/* Content Overlay */}
      <div className="content-overlay">
        {/* Header with Search */}
        <HeaderWithSearch
          searchValue={searchQuery}
          setSearchValue={handleSearch}
          city={city}
          setCity={setCity}
        />

        {loading ? (
          <div className="loading-container">
            <SpinLoading color="primary" style={{ fontSize: 48 }} />
            <div style={{ marginTop: 16, color: 'white', fontSize: 14 }}>Loading...</div>
          </div>
        ) : (
          <div className="content-section">
            {/* NEW: Advertisement after header */}
            <div className="section-container">
              <AdvertisementManager
                advertisements={advertisements}
                onAdUpdate={fetchAdvertisements}
                isAdmin={isAdmin}
                positionId={0} // Position 0 - after header
                pageKey="home"
              />
            </div>

            {/* Consultants Section */}
            <div className="section-container">
              <div className="section-header">
                <h3>
                  {searchQuery ? "Top Approved Consultants" : "Top Approved Consultants"}
                  {searchQuery && filteredConsultants.length > 0 && (
                    <span className="result-count"> ({filteredConsultants.length})</span>
                  )}
                </h3>
                {!searchQuery && (
                  <Button
                    size="small"
                    fill="none"
                    color="primary"
                    onClick={() => handleNavigateToTab('BookConsultant')}
                  >
                    View All
                  </Button>
                )}
              </div>

              {filteredConsultants.length > 0 ? (
                <Grid columns={3} gap={8}>
                  {getFirstNine(filteredConsultants).map((consultant, index) => (
                    <Grid.Item key={consultant.id || `consultant-${index}`}>
                      <Card className="consultant-card fixed-size-card">
                        <div className="card-content">
                          <div className="image-section">
                            <ImageWithFallback
                              src={consultant.image}
                              alt={consultant.name}
                              className="consultant-image"
                              type="consultant"
                              onClick={() => handleConsultantClick(consultant.id)}
                            />
                          </div>

                          <div className="info-section">
                            <div className="name-row">
                              <div className="name">{consultant.name}</div>
                            </div>

                            <div className="type-row">
                              <div className="type">{consultant.type}</div>
                            </div>

                            <div className="location-row">
                              <EnvironmentOutline className="location-icon" />
                              <span className="location-text">{consultant.location}</span>
                            </div>

                            <div className="languages-row">
                              {(consultant.formattedLanguages || formatLanguages(consultant.languages)).map((lang, idx) => (
                                <span key={idx} className="language-tag">{lang}</span>
                              ))}
                            </div>

                            <div className="detail-line">
                              Exp: <span>{consultant.formattedExperience}</span>
                            </div>

                            <div className="detail-line">
                              Fee: <span>{consultant.formattedFee}</span>
                            </div>

                            <div className="button-section">
                              <Button
                                size="mini"
                                color="primary"
                                className="view-btn"
                                onClick={() => handleConsultantClick(consultant.id)}
                              >
                                View Profile
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Grid.Item>
                  ))}
                </Grid>
              ) : searchQuery ? (
                <div className="empty-state">
                  <TeamOutline className="empty-icon" />
                  <p className="empty-text">
                    No approved consultants found for "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div className="empty-state">
                  <TeamOutline className="empty-icon" />
                  <p className="empty-text">
                    No approved consultants available at the moment
                  </p>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => handleNavigateToTab('BookConsultant')}
                  >
                    Browse All Consultants
                  </Button>
                </div>
              )}
            </div>

            {/* NEW: Advertisement after consultants */}
            <div className="section-container">
              <AdvertisementManager
                advertisements={advertisements}
                onAdUpdate={fetchAdvertisements}
                isAdmin={isAdmin}
                positionId={1} // Position 1 - after consultants
                pageKey="home"
              />
            </div>

            {/* Properties Section */}
            {filteredProperties.length > 0 || !searchQuery ? (
              <div className="section-container">
                <div className="section-header">
                  <h3>
                    {searchQuery ? "Property Results" : "Featured Approved Properties"}
                    {searchQuery && filteredProperties.length > 0 && (
                      <span className="result-count"> ({filteredProperties.length})</span>
                    )}
                  </h3>
                  {!searchQuery && (
                    <Button
                      size="small"
                      fill="none"
                      color="primary"
                      onClick={() => handleNavigateToTab('PropertyListing')}
                    >
                      View All
                    </Button>
                  )}
                </div>

                {filteredProperties.length > 0 ? (
                  <Grid columns={3} gap={8}>
                    {getFirstNine(filteredProperties).map((property, index) => (
                      <Grid.Item key={property.id || `property-${index}`}>
                        <Card className="property-card fixed-size-card">
                          <div className="card-content">
                            <div className="image-section">
                              <ImageWithFallback
                                src={property.image}
                                alt={property.title}
                                className="property-image"
                                type="property"
                                onClick={() => handlePropertyClick(property.id)}
                              />
                              <Badge
                                color={property.listingType === 'Rent' ? 'blue' : 'red'}
                                className="listing-badge"
                              >
                                {property.listingType}
                              </Badge>
                            </div>

                            <div className="info-section">
                              <div className="price-row">
                                <div className="price">{property.formattedPrice}</div>
                              </div>

                              <div className="title-row">
                                <div className="title">{property.title}</div>
                              </div>

                              <div className="details-row">
                                <span className="bhk">
                                  {property.bhk}
                                  <br />

                                  {property.area}
                                </span>
                              </div>

                              <div className="location-row">
                                <EnvironmentOutline className="location-icon" />
                                <span className="location">
                                  {property.city
                                    ? `${property.city}, ${property.state || ""}`
                                    : property.location || "Location not available"}
                                </span>
                              </div>

                              <div className="button-section">
                                <Button
                                  size="mini"
                                  color="primary"
                                  className="view-btn"
                                  onClick={() => handlePropertyClick(property.id)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Grid.Item>
                    ))}
                  </Grid>
                ) : !searchQuery ? (
                  <div className="empty-state">
                    <ShopbagOutline className="empty-icon" />
                    <p className="empty-text">
                      No approved properties available at the moment
                    </p>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleNavigateToTab('PropertyListing')}
                    >
                      Browse All Properties
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Show empty state for property search if no results */}
            {searchQuery && filteredProperties.length === 0 && (
              <div className="section-container">
                <div className="empty-state">
                  <ShopbagOutline className="empty-icon" />
                  <p className="empty-text">
                    No approved properties found for "{searchQuery}"
                  </p>
                </div>
              </div>
            )}

            {/* NEW: Advertisement after properties */}
            <div className="section-container">
              <AdvertisementManager
                advertisements={advertisements}
                onAdUpdate={fetchAdvertisements}
                isAdmin={isAdmin}
                positionId={2} // Position 2 - after properties
                pageKey="home"
              />
            </div>

            {/* Property Management Section - Always show */}
            <div className="section-container">
              <div className="section-header">
                <h3>Property Services</h3>
                <Button
                  size="small"
                  fill="none"
                  color="primary"
                  onClick={() => handleNavigateToTab('Management')}
                >
                  View All
                </Button>
              </div>

              <Grid columns={3} gap={8}>
                {getFirstNine(propertyManagementData).map((service) => (
                  <Grid.Item key={service.id}>
                    <Card className="management-card fixed-size-card">
                      <div className="card-content">
                        <div className="service-icon-section">
                          <div className="service-icon">
                            {service.type === 'Rental' && '🔑'}
                            {service.type === 'Maintenance' && '🔧'}
                            {service.type === 'Tenant' && '👥'}
                          </div>
                        </div>

                        <div className="info-section">
                          <div className="title-row">
                            <div className="title">{service.title}</div>
                          </div>

                          <div className="type-row">
                            <div className="type-tag">{service.type}</div>
                          </div>

                          <div className="description-row">
                            <div className="description">{service.description}</div>
                          </div>

                          <div className="price-row">
                            <div className="price">{service.price}</div>
                          </div>

                          <div className="button-section">
                            <Button
                              size="mini"
                              color="primary"
                              className="view-btn"
                              onClick={() => handleNavigateToTab('Management')}
                            >
                              Learn More
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Grid.Item>
                ))}
              </Grid>
            </div>

            {/* NEW: Final advertisement at the bottom */}
            <div className="section-container">
              <AdvertisementManager
                advertisements={advertisements}
                onAdUpdate={fetchAdvertisements}
                isAdmin={isAdmin}
                positionId={3} // Position 3 - bottom of page
                pageKey="home"
              />
            </div>
          </div>
        )}

        {/* Rest of your popups and modals remain the same */}
        <Popup
          visible={profileVisible}
          onMaskClick={() => setProfileVisible(false)}
          onClose={() => setProfileVisible(false)}
          bodyStyle={{
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
            minHeight: "40vh",
            padding: "24px 16px",
          }}
        >
          {profile ? (
            <div style={{ textAlign: "center" }}>
              <div className="profile-actions">
                <EditSOutline
                  fontSize={22}
                  style={{ color: "#1677ff", cursor: "pointer" }}
                  onClick={() => Toast.show({ icon: "loading", content: "Edit feature coming soon!" })}
                />
                <DeleteOutline
                  fontSize={22}
                  style={{ color: "#ff3141", cursor: "pointer" }}
                  onClick={deleteProfile}
                />
              </div>

              <Avatar
                src={profile.avatar}
                style={{
                  "--size": "80px",
                  "--border-radius": "50%",
                  backgroundColor: "#1677ff",
                  marginBottom: "16px",
                }}
                fallback={<UserOutline fontSize={40} />}
              />

              <h2>{profile.name || profile.role}</h2>

              <List style={{ marginTop: "16px" }}>
                <List.Item prefix={<PhoneFill />}>
                  <strong>{profile.phone}</strong>
                </List.Item>
                <List.Item prefix={<StarFill />}>
                  <Space wrap>
                    {profile.role?.map((r) => (
                      <span key={r} className="role-tag">
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </span>
                    ))}
                  </Space>
                </List.Item>
                <List.Item>
                  <div style={{ fontSize: "13px", color: "#8c8c8c" }}>
                    Joined: {new Date(profile.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </List.Item>
              </List>

              <Button
                color="primary"
                fill="solid"
                block
                size="large"
                style={{ marginTop: "16px" }}
                onClick={() => setProfileVisible(false)}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="loading-profile">
              <SpinLoading color="primary" style={{ fontSize: 48 }} />
            </div>
          )}
        </Popup>

        <AddConsultantModal
          visible={consultantFormVisible}
          setVisible={setConsultantFormVisible}
          refreshData={fetchConsultants}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelClick}
          userPhone={profile?.phone}

        />

        <AgentRegistration
          visible={agentFormVisible}
          setVisible={setAgentFormVisible}
          refreshData={fetchProperties}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelClick}
        />

        <PostProperty
          visible={postPropertyVisible}
          onClose={() => setPostPropertyVisible(false)}
          onSuccess={handleFormSuccess}
        />
      </div>

      <style jsx>{`
        .home-container {
          position: relative;
          min-height: 100vh;
        }
        
        .property-background-image {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          z-index: 0;
        }
        
        .content-overlay {
          position: relative;
          z-index: 1;
          padding-bottom: 80px;
          min-height: 100vh;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
          padding-top: 20px;
        }
        
        .content-section {
          padding: 8px 12px 0;
        }
        
        .section-container {
          margin-bottom: 20px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 16px 0 12px 0;
        }
        
        .section-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .empty-icon {
          font-size: 48px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 16px;
        }
        
        .empty-text {
          color: rgba(255,255,255,0.7);
          text-align: center;
          margin-bottom: 16px;
        }
        
        /* Enhanced Card Styles */
        .consultant-card,
        .property-card,
        .management-card {
          background: rgba(255, 255, 255, 0.15) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          overflow: hidden;
          padding: 8px !important;
          transition: transform 0.2s;
          height: 250px !important;
          display: flex;
          flex-direction: column;
        }
        
        .fixed-size-card {
          min-height: 250px !important;
          max-height: 250px !important;
          height: 250px !important;
        }
        
        .consultant-card:hover,
        .property-card:hover,
        .management-card:hover {
          transform: scale(1.05);
        }
        
        .card-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 6px;
        }
        
        .image-section {
          position: relative;
          flex-shrink: 0;
        }
        
        .consultant-image,
        .property-image {
          width: 100%;
          height: 80px;
          border-radius: 8px;
          object-fit: cover;
          background: rgba(255, 255, 255, 0.1);
          cursor: pointer;
        }
        
        /* Image Fallback Styles */
        .image-fallback {
          width: 100%;
          height: 80px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed rgba(255, 255, 255, 0.3);
          cursor: pointer;
        }
        
        .fallback-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .fallback-icon {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .fallback-text {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        }
        
        .service-icon-section {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 80px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          margin-bottom: 0;
        }
        
        .service-icon {
          font-size: 32px;
        }
        
        .listing-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 10px;
        }
        
        /* FIXED INFO SECTION LAYOUT */
        .info-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 120px;
        }
        
        /* Row-based layout for consistent spacing */
        .name-row,
        .title-row,
        .type-row,
        .location-row,
        .languages-row,
        .details-section,
        .details-row,
        .description-row,
        .price-row {
          display: flex;
          align-items: center;
          width: 100%;
        }
        
        .name,
        .title {
          font-weight: 600;
          font-size: 12px;
          color: white;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }
        
        .type {
          font-size: 10px;
          color: #1677ff;
          font-weight: 600;
          width: 100%;
        }
        
        .location-row {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.7);
          gap: 4px;
        }
        
        .location-icon {
          font-size: 10px;
          flex-shrink: 0;
        }
        
        .location-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        
        .languages-row {
          gap: 2px;
          flex-wrap: wrap;
        }
        
        .language-tag {
          font-size: 8px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 1px 4px;
          border-radius: 4px;
          white-space: nowrap;
        }
        
        /* FIXED DETAILS SECTION */
        .details-section {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin: 2px 0;
        }
        
        .experience-row,
        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
        }
        
        .experience-label,
        .price-label {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .experience-value {
          color: #ff6b00;
          font-weight: 600;
        }
        
        .price-value {
          color: #ff6b00;
          font-weight: 600;
          font-size: 10px;
        }
        
        .details-row {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .description-row {
          margin: 2px 0;
        }
        
        .description {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.8);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.3;
          width: 100%;
        }
        
        .type-tag {
          font-size: 8px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
        
        /* PRICE STYLING */
        .price {
          font-size: 12px;
          font-weight: 600;
          color: #ff6b00;
          width: 100%;
        }
        
        /* FIXED BUTTON SECTION */
        .button-section {
          margin-top: auto;
          display: flex;
          justify-content: center;
          padding-top: 6px;
        }
        
        .view-btn {
          font-size: 10px;
          height: 24px;
          min-width: 80px;
          flex-shrink: 0;
          cursor: pointer;
        }
        
        .role-tag {
          background: #1677ff;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin: 2px;
        }
        
        .detail-line {
          font-size: 10px;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .detail-line span {
          color: #ff6b00;
          font-weight: 500;
        }
        
        .search-results-info {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .search-query {
          color: white;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .search-counts {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .result-count {
          color: #ff6b00;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}