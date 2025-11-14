import React, { useState, useEffect, useRef, useCallback } from 'react'; 
import {
  Card, 
  Tag, 
  Empty,
  Image,
  Space,
  Badge,
  Toast,
  DotLoading,
  Ellipsis,
  Popup,
  List,
  Button,
  Grid,
  Modal,
  Selector,
  Slider,
} from 'antd-mobile';
import { 
  EnvironmentOutline, 
  HeartOutline,
  MoreOutline,
  SetOutline,
  UserOutline,
  InformationCircleOutline,
  MessageOutline,
  FilterOutline,
  CloseOutline,
  AddOutline,
  BellOutline,
  TeamOutline,
  StarOutline,
  PhoneFill, 
  MailFill,
} from 'antd-mobile-icons';
import { getProperties, getMyProperties } from '../services/properties';
import { getProfile } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import './PropertyListings.css';
import PostProperty from '../components/proparti/PostProperty';
import HeaderWithSearch from '../components/common/HeaderWithSearch';
import { getAgents } from '../services/agents';
import AdvertisementManager from '../components/common/AdvertisementManager';
import { advertisementService } from '../services/advertise';

const PropertyListings = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [approvedAgents, setApprovedAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [postVisible, setPostVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [agentModalVisible, setAgentModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Advertisement states
  const [advertisements, setAdvertisements] = useState({});
  const [adLoading, setAdLoading] = useState(false);

  const navigate = useNavigate();

  // Refs for scroll handling
  const mainContainerRef = useRef(null);

  // Get user's location for search bar placeholder
  const [userLocation, setUserLocation] = useState('Detecting...');
  const [userCity, setUserCity] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    propertyType: [],
    priceRange: [0, 100000000],
    bedrooms: [],
    furnished: [],
    bathrooms: [],
    constructionStatus: [],
    listingType: [],
    areaRange: [0, 10000],
    amenities: []
  });
  
  // Initial filter state for reset functionality
  const initialFilters = useRef({
    propertyType: [],
    priceRange: [0, 100000000],
    bedrooms: [],
    furnished: [],
    bathrooms: [],
    constructionStatus: [],
    listingType: [],
    areaRange: [0, 10000],
    amenities: []
  }).current;

  // Check if user is admin
  const isAdmin = currentUser?.phone === process.env.REACT_APP_ADMIN_PHONE;

  // Fetch advertisements
  const fetchAdvertisements = async () => {
    try {
      setAdLoading(true);
      const response = await advertisementService.getAllAdvertisements("property-listing");
      if (response.data.success) {
        const adsByPosition = {};
        response.data.data.forEach(ad => {
          if (!adsByPosition[ad.position]) {
            adsByPosition[ad.position] = [];
          }
          adsByPosition[ad.position].push(ad);
        });
        setAdvertisements(adsByPosition);
      }
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      Toast.show("Failed to load advertisements");
    } finally {
      setAdLoading(false);
    }
  };

  // Get advertisement for a specific position
  const getAdvertisementForPosition = (position) => {
    return advertisements[position] ? advertisements[position][0] : null;
  };

  // Filter options
  const filterOptions = {
    propertyType: [
      { label: 'Apartment', value: 'Apartment' },
      { label: 'Studio', value: 'Studio' },
      { label: 'Independent House', value: 'Independent House' },
      { label: 'Villa', value: 'Villa' },
      { label: 'Plot', value: 'Plot' },
      { label: 'Commercial Office', value: 'Commercial Office' },
      { label: 'Commercial Shop', value: 'Commercial Shop' },
      { label: 'Warehouse', value: 'Warehouse' },
      { label: 'Industrial Land', value: 'Industrial Land' },
      { label: 'Farmhouse', value: 'Farmhouse' }
    ],
    bedrooms: [
      { label: 'Studio', value: 'Studio' },
      { label: '1 BHK', value: '1 BHK' },
      { label: '2 BHK', value: '2 BHK' },
      { label: '3 BHK', value: '3 BHK' },
      { label: '4 BHK', value: '4 BHK' },
      { label: '5 BHK', value: '5 BHK' },
      { label: '6 BHK+', value: '6 BHK+' },
      { label: 'Independent Floor', value: 'Independent Floor' }
    ],
    bathrooms: [
      { label: '1 Bath', value: '1' },
      { label: '2 Bath', value: '2' },
      { label: '3 Bath', value: '3' },
      { label: '4+ Bath', value: '4' }
    ],
    furnished: [
      { label: 'Unfurnished', value: 'Unfurnished' },
      { label: 'Semi-Furnished', value: 'Semi-Furnished' },
      { label: 'Furnished', value: 'Furnished' }
    ],
    constructionStatus: [
      { label: 'Ready to Move', value: 'Ready to Move' },
      { label: 'Under Construction', value: 'Under Construction' },
      { label: 'New', value: 'New' },
      { label: 'Resale', value: 'Resale' }
    ],
    listingType: [
      { label: 'For Sale', value: 'Sale' },
      { label: 'For Rent', value: 'Rent' }
    ]
  };

  // Common amenities
  const commonAmenities = [
    'Lift', 'Power Backup', 'Security', 'Gated Community',
    'Club House', 'Gym', 'Swimming Pool', 'Car Parking',
    'Garden/Park', '24x7 Water Supply', 'Visitor Parking',
    'Children\'s Play Area', 'Jogging Track', 'Indoor Games'
  ];

  // Fetch agents from backend
  const fetchAgents = async () => {
    try {
      setAgentsLoading(true);
      const result = await getAgents();
      
      if (result.success) {
        const allAgents = result.data?.data || result.data || [];
        
        // Filter ONLY approved agents
        const approvedAgents = allAgents.filter(agent => 
          agent.status === "approved" || agent.isApproved === true
        );
        
        setAgents(allAgents);
        setApprovedAgents(approvedAgents);
        
        // Apply location filter to agents
        applyAgentFilters(approvedAgents);
      } else {
        console.error('Failed to fetch agents:', result.error);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setAgentsLoading(false);
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const city = data.city || data.locality || 'Your City';
            setUserLocation(city);
            setUserCity(city);
          } catch (error) {
            console.error('Error getting location:', error);
            setUserLocation('Surat');
            setUserCity('Surat');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setUserLocation('Surat');
          setUserCity('Surat');
        }
      );
    } else {
      setUserLocation('Surat');
      setUserCity('Surat');
    }
  };

  // Enhanced Filter Modal Component
  const FilterModal = () => {
    const [localFilters, setLocalFilters] = useState(filters);
    const modalContentRef = useRef(null);

    // Sync local state when modal opens or parent filters change externally (rarely)
    useEffect(() => {
      setLocalFilters(filters);
    }, [filters, filterVisible]);
    
    // Scroll to top when modal opens
    useEffect(() => {
        if (filterVisible && modalContentRef.current) {
            modalContentRef.current.scrollTop = 0;
        }
    }, [filterVisible]);

    // Handle filter changes without page refresh
    const handleFilterChange = (filterType, value) => {
      // Update local state only
      setLocalFilters(prev => ({ 
        ...prev, 
        [filterType]: value 
      }));
    };

    // Handle amenity toggle without refresh
    const handleAmenityToggle = (amenity) => {
      const updatedAmenities = localFilters.amenities?.includes(amenity)
        ? localFilters.amenities.filter(a => a !== amenity)
        : [...(localFilters.amenities || []), amenity];
      
      // Update local state only
      setLocalFilters(prev => ({ 
        ...prev, 
        amenities: updatedAmenities 
      }));
    };

    // Reset filters without closing modal
    const handleResetFilters = () => {
      setLocalFilters(initialFilters);
      setFilters(initialFilters);
      setFilterVisible(false);
      Toast.show('Filters reset successfully!');
    };

    // Apply filters and close modal
    const handleApplyFilters = () => {
      setFilters(localFilters); 
      setFilterVisible(false);
      Toast.show('Filters applied successfully!');
    };

    return (
      <Modal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        closeOnMaskClick
        showCloseButton={false}
        bodyStyle={{
          height: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px 16px 0 0',
          padding: '0'
        }}
        content={
          <div
            className="filter-modal-content mobile-filter-content"
            onClick={(e) => e.stopPropagation()}
            ref={modalContentRef}
          >
            {/* Header - Fixed */}
            <div className="filter-modal-header">
              <span className="filter-modal-title">Filters</span>
              <button
                className="close-filter-btn"
                onClick={() => setFilterVisible(false)}
              >
                <CloseOutline />
              </button>
            </div>

            {/* Scrollable content */}
            <div 
              className="filter-scroll-content"
              style={{ 
                flex: 1, 
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {/* Listing Type */}
              <div className="filter-section">
                <h4>Listing Type</h4>
                <Selector
                  options={filterOptions.listingType}
                  value={localFilters.listingType}
                  onChange={(val) => handleFilterChange('listingType', val)}
                  multiple
                  columns={2}
                />
              </div>

              {/* Property Type */}
              <div className="filter-section">
                <h4>Property Type</h4>
                <Selector
                  options={filterOptions.propertyType}
                  value={localFilters.propertyType}
                  onChange={(val) => handleFilterChange('propertyType', val)}
                  multiple
                  columns={2}
                />
              </div>

              {/* Price Range */}
              <div className="filter-section">
                <h4>Price Range</h4>
                <div className="price-range-display mobile-price-display">
                  ₹{localFilters.priceRange[0].toLocaleString()} - ₹{localFilters.priceRange[1].toLocaleString()}
                </div>
                <Slider
                  range
                  min={0}
                  max={100000000}
                  step={100000}
                  value={localFilters.priceRange}
                  onChange={(value) => handleFilterChange('priceRange', value)}
                />
                <div className="price-range-labels mobile-range-labels">
                  <span>₹0</span>
                  <span>₹10Cr</span>
                </div>
              </div>

              {/* Area Range */}
              <div className="filter-section">
                <h4>Area Range (sq.ft)</h4>
                <div className="area-range-display mobile-price-display">
                  {localFilters.areaRange[0]} - {localFilters.areaRange[1]} sq.ft
                </div>
                <Slider
                  range
                  min={0}
                  max={10000}
                  step={100}
                  value={localFilters.areaRange}
                  onChange={(value) => handleFilterChange('areaRange', value)}
                />
                <div className="area-range-labels mobile-range-labels">
                  <span>0 sq.ft</span>
                  <span>10,000 sq.ft</span>
                </div>
              </div>

              {/* Bedrooms */}
              <div className="filter-section">
                <h4>Bedrooms</h4>
                <Selector
                  options={filterOptions.bedrooms}
                  value={localFilters.bedrooms}
                  onChange={(val) => handleFilterChange('bedrooms', val)}
                  multiple
                  columns={3}
                />
              </div>

              {/* Furnishing */}
              <div className="filter-section">
                <h4>Furnishing</h4>
                <Selector
                  options={filterOptions.furnished}
                  value={localFilters.furnished}
                  onChange={(val) => handleFilterChange('furnished', val)}
                  multiple
                  columns={2}
                />
              </div>

              {/* Construction Status */}
              <div className="filter-section">
                <h4>Construction Status</h4>
                <Selector
                  options={filterOptions.constructionStatus}
                  value={localFilters.constructionStatus}
                  onChange={(val) => handleFilterChange('constructionStatus', val)}
                  multiple
                  columns={2}
                />
              </div>

              {/* Bathrooms */}
              <div className="filter-section">
                <h4>Bathrooms</h4>
                <Selector
                  options={filterOptions.bathrooms}
                  value={localFilters.bathrooms}
                  onChange={(val) => handleFilterChange('bathrooms', val)}
                  multiple
                  columns={2}
                />
              </div>

              {/* Amenities */}
              <div className="filter-section">
                <h4>Amenities</h4>
                <div className="amenities-chips-container mobile-amenities">
                  {commonAmenities.map((amenity) => (
                    <div
                      key={amenity}
                      className={`amenity-chip mobile-amenity-chip ${
                        localFilters.amenities?.includes(amenity) ? 'active' : ''
                      }`}
                      onClick={() => handleAmenityToggle(amenity)}
                    >
                      <span className="amenity-chip-icon">✓</span>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed bottom buttons */}
            <div className="filter-actions mobile-filter-actions">
              <Button
                className="reset-button mobile-reset-btn"
                onClick={handleResetFilters}
              >
                Reset All
              </Button>
              <Button
                className="apply-button mobile-apply-btn"
                color="primary"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        }
      />
    );
  };
  
  // Menu Popup Component
  const MenuPopup = () => (
    <Popup visible={menuVisible} onMaskClick={() => setMenuVisible(false)} position="right" bodyStyle={{ width: '80vw', height: '100vh', borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }}>
      <div className="menu-popup">
        <div className="menu-header">
          <div className="menu-user-info">
            <div className="user-avatar">
              <UserOutline />
            </div>
            <div className="user-details">
              <h3>{currentUser?.name || 'Welcome!'}</h3>
              <p>Explore properties in {userLocation}</p>
            </div>
          </div>
          <Button fill="none" size="small" onClick={() => setMenuVisible(false)} className="close-menu-btn">
            <CloseOutline />
          </Button>
        </div>

        <List className="menu-list">
          {[
            { icon: <UserOutline />, label: 'My Profile', action: () => navigate('/profile') },
            { icon: <BellOutline />, label: 'Notifications', action: () => Toast.show('Notifications clicked') },
            { icon: <HeartOutline />, label: 'Favorites', action: () => navigate('/favorites') },
            { icon: <UserOutline />, label: 'My Properties', action: () => navigate('/my-properties') },
            { icon: <TeamOutline />, label: 'Find Agents', action: () => navigate('/consultants') },
            { icon: <SetOutline />, label: 'Settings', action: () => Toast.show('Settings clicked') },
            { icon: <InformationCircleOutline />, label: 'About Us', action: () => Toast.show('About Us clicked') }
          ].map((item, index) => (
            <List.Item 
              key={index} 
              prefix={item.icon} 
              onClick={() => { 
                setMenuVisible(false); 
                item.action(); 
              }}
            >
              {item.label}
            </List.Item>
          ))}
        </List>

        <div className="menu-footer">
          {currentUser ? (
            <Button color="primary" fill="solid" size="large" className="logout-btn" onClick={handleLogout}>
              Delete Account 
            </Button>
          ) : (
            <Button color="primary" fill="solid" size="large" className="login-btn" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </div>
      </div>
    </Popup>
  );

  // Agent Card Component 
  const AgentCard = ({ agent }) => {
    const getAgentImage = (agent) => {
      if (agent.image && agent.image !== 'null' && agent.image !== 'undefined') {
        if (agent.image.startsWith('http') || agent.image.startsWith('https')) {
          return agent.image;
        } else {
          return `http://localhost:5000/${agent.image}`;
        }
      }
      return 'https://via.placeholder.com/120x80/f0f0f0/666666?text=Agent';
    };

    const formatLanguages = (languages) => {
      if (!languages) return ['ENG'];
      if (Array.isArray(languages)) {
        return languages.slice(0, 3).map(lang => lang.substring(0, 3).toUpperCase());
      }
      return ['ENG'];
    };

    return (
      <div className="property-grid-item" onClick={() => handleViewAgent(agent)}>
        <Card className="property-card grid-card transparent-card agent-card">
          <div className="property-card-content">
            <div className="property-image-container">
              <Image 
                src={getAgentImage(agent)} 
                alt={agent.agentName} 
                className="property-image" 
                fallback={
                  <div className="image-fallback">
                    <div className="fallback-icon">👤</div>
                  </div>
                } 
              />
              <div className="listing-badge">
                <Badge color="#00897b" content="Agent" />
              </div>
              {/* Approved Badge */}
              {(agent.status === "approved" || agent.isApproved === true) && (
                <div className="status-badge approved-badge">
                  <Badge color="success" content="Verified" />
                </div>
              )}
            </div>

            <div className="property-details">
              <div className="property-price-main">
                {agent.firmName || 'Independent Agent'}
              </div>
              <div className="property-title">
                <Ellipsis content={agent.agentName || 'Agent'} row={1} />
              </div>
              <div className="property-location">
                <EnvironmentOutline className="location-icon" />
                <Ellipsis content={agent.operatingCity || 'City not specified'} row={1} />
              </div>
              
              {/* Operating Areas */}
              <div className="agent-languages">
                <Space wrap>
                  {formatLanguages(agent.operatingAreas).map((area, idx) => (
                    <Tag key={idx} className="feature-tag" fill="outline" style={{ fontSize: '10px' }}>
                      {area}
                    </Tag>
                  ))}
                </Space>
              </div>

              {/* Experience and Deals */}
              <div className="agent-features">
                <Space wrap>
                  {agent.operatingSince && (
                    <Tag className="feature-tag" fill="outline" style={{ fontSize: '10px' }}>
                      Exp: {new Date().getFullYear() - agent.operatingSince} Yrs
                    </Tag>
                  )}
                  {agent.dealsIn && agent.dealsIn.length > 0 && (
                    <Tag className="feature-tag" fill="outline" style={{ fontSize: '10px' }}>
                      {agent.dealsIn[0]}
                    </Tag>
                  )}
                </Space>
              </div>

              <div className="property-footer">
                <Button 
                  color="primary" 
                  size="mini" 
                  className="view-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewAgent(agent);
                  }}
                >
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // Agent Info Modal Component
  const AgentInfoModal = () => {
    if (!selectedAgent) return null;

    const getAgentImage = (agent) => {
      if (agent.image && agent.image !== 'null' && agent.image !== 'undefined') {
        if (agent.image.startsWith('http') || agent.image.startsWith('https')) {
          return agent.image;
        } else {
          return `http://localhost:5000/${agent.image}`;
        }
      }
      return 'https://via.placeholder.com/150/f0f0f0/666666?text=Agent';
    };

    return (
      <Modal
        visible={agentModalVisible}
        onClose={() => setAgentModalVisible(false)}
        closeOnMaskClick
        showCloseButton
        title="Agent Details"
        bodyStyle={{ padding: '0' }}
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Image 
            src={getAgentImage(selectedAgent)} 
            alt={selectedAgent.agentName} 
            style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: '15px' }}
          />
          <h2>{selectedAgent.agentName}</h2>
          <p style={{ color: '#888', marginBottom: '10px' }}>{selectedAgent.firmName || 'Independent Agent'}</p>
          
          <List header="Contact & Details">
            <List.Item prefix={<PhoneFill />}>
              {selectedAgent.phoneNumber || 'N/A'}
            </List.Item>
            <List.Item prefix={<MailFill />}>
              {selectedAgent.email || 'N/A'}
            </List.Item>
            <List.Item prefix={<EnvironmentOutline />}>
              Operating in: {selectedAgent.operatingCity || 'N/A'}
            </List.Item>
            <List.Item prefix={<StarOutline />}>
              Specializes in: {selectedAgent.dealsIn?.join(', ') || 'General Real Estate'}
            </List.Item>
            {selectedAgent.operatingAreas?.length > 0 && (
              <List.Item title="Areas of Expertise">
                <Space wrap>
                  {selectedAgent.operatingAreas.map((area, idx) => (
                    <Tag key={idx} color="primary" fill="outline">{area}</Tag>
                  ))}
                </Space>
              </List.Item>
            )}
            <List.Item title="Description">
              {selectedAgent.description || 'No description provided.'}
            </List.Item>
          </List>
          
          <Button 
            color="primary" 
            style={{ marginTop: '20px' }}
            onClick={() => {
              window.location.href = `tel:${selectedAgent.phoneNumber}`;
              setAgentModalVisible(false);
            }}
          >
            Call Now
          </Button>
        </div>
      </Modal>
    );
  };

  // Handle view agent details
  const handleViewAgent = (agent) => {
    setSelectedAgent(agent);
    setAgentModalVisible(true);
  };

  // Filter properties by location - IMPROVED
  const filterByLocation = (properties) => {
    if (!userCity || userCity === 'Detecting...' || userCity === '') {
      return properties;
    }
    
    // Filter properties that match the user's city
    const currentCityProperties = properties.filter(property => {
      const propertyCity = property.city?.toLowerCase();
      const userCityLower = userCity.toLowerCase();
      
      return propertyCity?.includes(userCityLower) || 
             userCityLower.includes(propertyCity) ||
             property.locality?.toLowerCase().includes(userCityLower) ||
             userCityLower.includes(property.locality?.toLowerCase());
    });
    
    return currentCityProperties;
  };

  // Apply filters to agents based on location
  const applyAgentFilters = (agentsList = approvedAgents) => {
    if (userCity && userCity !== 'Detecting...') {
      const locationFilteredAgents = agentsList.filter(agent => 
        agent.operatingCity?.toLowerCase().includes(userCity.toLowerCase()) ||
        agent.operatingAreas?.some(area => 
          area.toLowerCase().includes(userCity.toLowerCase())
        )
      );
      setFilteredAgents(locationFilteredAgents);
    } else {
      setFilteredAgents(agentsList);
    }
  };

  // Enhanced Apply filters function
  const applyFilters = useCallback(() => {
    // First, filter only approved properties
    let filtered = properties.filter(property => 
      property.status === "approved" || property.isApproved === true
    );

    console.log('Total approved properties:', filtered.length);
    
    // Apply location filter FIRST
    if (userCity && userCity !== 'Detecting...' && userCity !== '') {
      filtered = filterByLocation(filtered);
      console.log('After location filter:', filtered.length);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.locality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.propertyType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply other filters
    if (filters.listingType.length > 0) {
      filtered = filtered.filter(property => 
        filters.listingType.includes(property.listingType)
      );
    }

    if (filters.propertyType.length > 0) {
      filtered = filtered.filter(property => 
        filters.propertyType.includes(property.propertyType)
      );
    }

    // Price range filter
    filtered = filtered.filter(property => 
      property.price >= filters.priceRange[0] && property.price <= filters.priceRange[1]
    );

    // Area range filter
    filtered = filtered.filter(property => {
      const area = property.carpetArea || 0;
      return area >= filters.areaRange[0] && area <= filters.areaRange[1];
    });

    // Bedrooms filter
    if (filters.bedrooms.length > 0) {
      filtered = filtered.filter(property => 
        filters.bedrooms.includes(property.bedrooms)
      );
    }

    // Furnishing filter
    if (filters.furnished.length > 0) {
      filtered = filtered.filter(property => 
        filters.furnished.includes(property.furnishing)
      );
    }

    // Construction status filter
    if (filters.constructionStatus.length > 0) {
      filtered = filtered.filter(property => 
        filters.constructionStatus.includes(property.constructionStatus)
      );
    }

    // Bathrooms filter
    if (filters.bathrooms.length > 0) {
      filtered = filtered.filter(property => {
        const propertyBathrooms = property.bathrooms?.toString();
        return filters.bathrooms.includes(propertyBathrooms);
      });
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(property => {
        const propertyAmenities = property.amenities || [];
        return filters.amenities.every(amenity => 
          propertyAmenities.includes(amenity)
        );
      });
    }

    console.log('Final filtered properties:', filtered.length);
    setFilteredProperties(filtered);
  }, [properties, userCity, searchQuery, filters]);

  // Format price to Indian format
  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString()}`;
  };

  // Format area
  const formatArea = (area) => area ? `${area} sq.ft` : '';

  // Get first available image
  const getPropertyImage = (property) => {
    if (property.images && property.images.length > 0) {
      const firstImage = property.images[0];
      if (firstImage.startsWith('http') || firstImage.startsWith('https')) {
        return firstImage;
      } else {
        return `http://localhost:5000/${firstImage}`;
      }
    }
    return '/default-property.jpg';
  };

  // Fetch properties from backend
  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProperties();
      
      if (result.success) {
        const allProperties = result.data.data || [];
        
        console.log('Total properties fetched:', allProperties.length);
        
        // Filter only approved properties initially
        const approvedOnly = allProperties.filter(p => 
          p.status === "approved" || p.isApproved === true
        );
        
        console.log('Approved properties:', approvedOnly.length);
        
        setProperties(allProperties);
        
        // Apply location filter to initial properties
        if (userCity && userCity !== 'Detecting...') {
          const locationFiltered = filterByLocation(approvedOnly);
          setFilteredProperties(locationFiltered);
          console.log('Location filtered properties:', locationFiltered.length);
        } else {
          setFilteredProperties(approvedOnly);
        }

      } else {
        setError(result.error || 'Failed to fetch properties');
        Toast.show({ content: result.error || 'Failed to fetch properties', position: 'bottom' });
      }
    } catch (err) {
      setError('Network error occurred');
      Toast.show({ content: 'Network error occurred', position: 'bottom' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user profile
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const res = await getProfile();
        if (res.success) {
          setCurrentUser(res.data.user);
        }
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
  };

  // Handle location change
  const handleLocationChange = (value) => {
    setUserLocation(value);
    setUserCity(value);
  };

  // Get badge color based on listing type
  const getListingTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'sale': return '#ff4d4f';
      case 'rent': return '#1890ff';
      default: return '#52c41a';
    }
  };

  // Handle view details - navigate to property details page
  const handleViewDetails = (property) => {
    if (property._id) {
      navigate(`/PropertyDetails/${property._id}`);
    } else {
      Toast.show('Property ID not found');
    }
  };

  // Handle post property
  const handlePostProperty = () => {
    if (!currentUser) {
      Toast.show('Please login to post property');
      navigate('/login');
      return;
    }
    setPostVisible(true);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setMenuVisible(false);
    Toast.show('Logged out successfully');
  };

  // Handle property added successfully
  const handlePropertyAdded = () => {
    fetchProperties();
    setPostVisible(false);
    Toast.show('Property posted successfully!');
  };

  // Refresh properties function
  const refreshProperties = () => {
    fetchProperties();
    fetchAgents();
    fetchAdvertisements();
  };

  useEffect(() => {
    getUserLocation();
    fetchCurrentUser();
    fetchAdvertisements();
  }, []);

  // Fetch properties and agents when userCity changes
  useEffect(() => {
    if (userCity && userCity !== 'Detecting...') {
      fetchProperties();
      fetchAgents();
    }
  }, [userCity]);

  // Apply filters when any filter criteria changes
  useEffect(() => {
    if (properties.length > 0) {
      applyFilters();
    }
  }, [filters, searchQuery, properties.length, applyFilters]);

  // Apply agent filters when userCity changes
  useEffect(() => {
    if (approvedAgents.length > 0) {
      applyAgentFilters();
    }
  }, [userCity, approvedAgents]);

  // Get approved properties count for display
  const approvedPropertiesCount = properties.filter(property => 
    property.status === "approved" || property.isApproved === true
  ).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <DotLoading color="primary" />
          <div className="loading-text">Loading properties in {userCity}...</div>
        </div>
      </div>
    );
  }

  if (error && properties.length === 0) {
    return (
      <div className="error-container">
        <Empty description="Failed to load properties" imageStyle={{ width: 128, height: 128 }} />
        <Button color="primary" onClick={fetchProperties} className="retry-button">
          Try Again
        </Button>
      </div>
    );
  }

  // Function to render individual advertisement card for specific position
  const AdvertisementCard = ({ position }) => {
    const ad = getAdvertisementForPosition(position);
    
    return (
      <div style={{ margin: '16px 0' }}>
        <AdvertisementManager
          advertisements={ad ? [ad] : []}
          onAdUpdate={fetchAdvertisements}
          isAdmin={isAdmin}
          positionId={position}
          pageKey="property-listing"
          key={`ad-${position}`}
        />
      </div>
    );
  };

  // Determine if we should show agents prominently (when no properties)
  const showAgentsProminently = filteredProperties.length === 0 && filteredAgents.length > 0;

  return (
    <div className="property-listings-container">
      {/* Background Image - Same as home.jsx */}
      <div className="property-background-image"></div>
      
      {/* Content Overlay - Same as home.jsx */}
      <div className="content-overlay">
        {/* HeaderWithSearch component */}
        <HeaderWithSearch
          searchValue={searchQuery}
          setSearchValue={setSearchQuery}
          city={userLocation}
          setCity={handleLocationChange}
        />

        {/* Filter and Refresh Buttons */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '8px 16px',
            marginBottom: '0px',
            marginTop: '0px'
          }}
        >
          <div className="filter-section-header">
            <Button 
              color="primary" 
              fill="outline" 
              className="filter-button mobile-filter-button" 
              onClick={() => setFilterVisible(true)}
              style={{
                padding: '10px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              <FilterOutline />
              Filter
            </Button>
          </div>
          
          <Button 
            color="default" 
            fill="outline" 
            onClick={refreshProperties}
            style={{
              padding: '10px 14px',
              borderRadius: '20px',
              fontSize: '13px'
            }}
          >
            Refresh
          </Button>
        </div>

        {/* Results Count */}
      

        {/* Main Content Area */}
        <div className="main-content-area" style={{ marginTop: '0px', paddingTop: '0px' }}>
          
          {/* Show Agents Prominently when NO properties */}
          {showAgentsProminently && (
            <div className="agents-section-prominent" style={{ padding: '16px' }}>
              <div className="section-header-prominent">
                <h3 style={{ color: 'white', marginBottom: '12px', fontSize: '16px', fontWeight: '600', textAlign: 'center' }}>
                  Verified Real Estate Agents in {userCity} ({filteredAgents.length})
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: '14px', margin: 0 }}>
                  No properties found? Connect with local experts!
                </p>
              </div>
              
              {/* Agents Grid */}
              <div className="properties-grid">
                {filteredAgents.slice(0, 6).map((agent) => (
                  <AgentCard key={agent._id} agent={agent} />
                ))}
              </div>

              {/* Advertisement after agents */}
              <AdvertisementCard position={2} />
            </div>
          )}

          {/* Properties Section - Only show when there are properties */}
          {filteredProperties.length > 0 ? (
            <div className="properties-section" style={{ marginTop: '0px', paddingTop: '0px' }}>
              <div className="properties-grid-container" style={{ marginTop: '0px', paddingTop: '0px' }}>
                {/* All Properties in one continuous grid */}
                <div className="properties-grid" style={{ marginTop: '0px' }}>
                  {filteredProperties.map((property, index) => (
                    <div key={property._id} className="property-grid-item">
                      <Card className="property-card grid-card transparent-card" onClick={() => handleViewDetails(property)}>
                        <div className="property-card-content">
                          <div className="property-image-container">
                            <Image 
                              src={getPropertyImage(property)} 
                              alt={property.title} 
                              className="property-image" 
                              fallback={
                                <div className="image-fallback">
                                  <div className="fallback-icon">🏠</div>
                                </div>
                              } 
                            />
                            <div className="listing-badge">
                              <Badge color={getListingTypeColor(property.listingType)} content={property.listingType} />
                            </div>
                            {(property.status === "approved" || property.isApproved) && (
                              <div className="status-badge approved-badge">
                                <Badge color="success" content="Approved" />
                              </div>
                            )}
                          </div>

                          <div className="property-details">
                            <div className="property-price-main">
                              {formatPrice(property.price)}
                            </div>
                            <div className="property-title">
                              <Ellipsis content={property.title} row={1} />
                            </div>
                            <div className="property-location">
                              <EnvironmentOutline className="location-icon" />
                              <Ellipsis content={[property.city, property.state].filter(Boolean).join(', ')} row={1} />
                            </div>
                            <div className="property-features">
                              <Space wrap>
                                {property.bedrooms && <Tag className="feature-tag" fill="outline">{property.bedrooms}</Tag>}
                                {property.carpetArea && <Tag className="feature-tag" fill="outline">{formatArea(property.carpetArea)}</Tag>}
                              </Space>
                            </div>
                            <div className="property-footer">
                              <Button 
                                color="primary" 
                                size="mini" 
                                className="view-button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(property);
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* Single advertisement after all properties */}
                <AdvertisementCard position={0} />
              </div>
            </div>
          ) : !showAgentsProminently ? (
            /* When no properties and no agents, show empty state */
            <div className="no-properties-section" style={{ padding: '20px 16px', minHeight: '40vh' }}>
              <Empty 
                description={
                  searchQuery 
                    ? "No approved properties match your search" 
                    : approvedPropertiesCount === 0 && properties.length > 0
                      ? "No approved properties available yet" 
                      : `No properties found in ${userCity}`
                } 
                imageStyle={{ width: 128, height: 128 }} 
              />
              {properties.length > 0 && approvedPropertiesCount === 0 && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>
                    Found {properties.length} total properties in system, but none are approved yet.
                  </p>
                  <Button color="primary" onClick={refreshProperties}>
                    Refresh Data
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          {/* Agents Section - Show below properties when there ARE properties */}
          {filteredProperties.length > 0 && filteredAgents.length > 0 && (
            <div className="agents-section" style={{ marginTop: '20px', padding: '16px' }}>
             
              
              {/* Agents Grid */}
              <div className="properties-grid">
                {filteredAgents.slice(0, 6).map((agent) => (
                  <AgentCard key={agent._id} agent={agent} />
                ))}
              </div>

              {/* Advertisement after agents */}
              <AdvertisementCard position={2} />
            </div>
          )}
        </div>

        {/* Post Property Floating Button */}
        {currentUser && (
          <div className="floating-action-button" onClick={handlePostProperty}>
            <AddOutline className="fab-icon" />
          </div>
        )}

        {/* Modals and Popups */}
        <FilterModal />
        <MenuPopup />
        <AgentInfoModal />
        <PostProperty 
          visible={postVisible} 
          onClose={() => setPostVisible(false)}
          onSuccess={handlePropertyAdded}
        />
      </div>

      <style jsx>{`
        .property-listings-container {
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
      `}</style>
    </div>
  );
};

export default PropertyListings;