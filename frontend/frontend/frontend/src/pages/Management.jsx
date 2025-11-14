import React, { useState, useEffect } from "react";
import {
  SearchBar,
  Grid,
  Card,
  Tag,
  Button,
  Rate,
  Toast,
  Space,
  DotLoading,
  Empty,
  Popup,
  List,
  Modal,
  Ellipsis,
  Selector,
  Slider,
} from "antd-mobile";
import {
  EnvironmentOutline,
  CloseOutline,
} from "antd-mobile-icons";
import { useNavigate } from "react-router-dom";
import { getProfile } from "../services/auth";
import { advertisementService } from "../services/advertise";
import HeaderWithSearch from "../components/common/HeaderWithSearch";
import AdvertisementManager from "../components/common/AdvertisementManager";
const Settings = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState("Surat");
  const [currentUser, setCurrentUser] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [locationVisible, setLocationVisible] = useState(false);

  // Advertisement states
  const [advertisements, setAdvertisements] = useState([]);
  const [adLoading, setAdLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    propertyType: [],
    minRating: 0,
    priceRange: [0, 50000000],
  });

  // Available locations
  const availableLocations = [
    "Surat City Center",
    "Adajan",
    "Varachha",
    "Athwa",
    "Vesu",
    "Piplod",
    "Rander",
    "Pal",
    "Althan",
    "Katargam",
    "Udhna",
    "Sarthana"
  ];

  // Property type options
  const propertyTypeOptions = [
    { label: 'Apartment', value: 'Apartment' },
    { label: 'Villa', value: 'Villa' },
    { label: 'House', value: 'House' },
    { label: 'Commercial', value: 'Commercial' },
    { label: 'Plot', value: 'Plot' },
  ];

  // Check if user is admin
  const isAdmin = currentUser?.phone === process.env.REACT_APP_ADMIN_PHONE;

  // Fetch advertisements
  const fetchAdvertisements = async () => {
    try {
      setAdLoading(true);
// Change this line in fetchAdvertisements function:
const response = await advertisementService.getAllAdvertisements("management");      if (response.data.success) {
        setAdvertisements(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      Toast.show("Failed to load advertisements");
    } finally {
      setAdLoading(false);
    }
  };

  // Rest of your existing code remains the same...
  // (loadProperties, fetchCurrentUser, applyFiltersAndSearch, etc.)

  // Demo Property Data
  const demoProperties = [
    {
      id: 1,
      title: "Luxury Apartment in City Center",
      type: "Apartment",
      location: "Surat City Center",
      price: 8500000,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      bedrooms: 3,
      bathrooms: 2,
      area: 1250,
      features: ["Swimming Pool", "Gym", "Parking", "Security"],
      status: "Active"
    },
    {
      id: 2,
      title: "Modern Villa with Garden",
      type: "Villa",
      location: "Adajan, Surat",
      price: 12500000,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=300&fit=crop",
      bedrooms: 4,
      bathrooms: 3,
      area: 2200,
      features: ["Garden", "Parking", "Security", "Modular Kitchen"],
      status: "Active"
    },
    {
      id: 1,
      title: "Luxury Apartment in City Center",
      type: "Apartment",
      location: "Surat City Center",
      price: 8500000,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      bedrooms: 3,
      bathrooms: 2,
      area: 1250,
      features: ["Swimming Pool", "Gym", "Parking", "Security"],
      status: "Active"
    },
    {
      id: 2,
      title: "Modern Villa with Garden",
      type: "Villa",
      location: "Adajan, Surat",
      price: 12500000,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=300&fit=crop",
      bedrooms: 4,
      bathrooms: 3,
      area: 2200,
      features: ["Garden", "Parking", "Security", "Modular Kitchen"],
      status: "Active"
    },
    {
      id: 1,
      title: "Luxury Apartment in City Center",
      type: "Apartment",
      location: "Surat City Center",
      price: 8500000,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      bedrooms: 3,
      bathrooms: 2,
      area: 1250,
      features: ["Swimming Pool", "Gym", "Parking", "Security"],
      status: "Active"
    },
    {
      id: 2,
      title: "Modern Villa with Garden",
      type: "Villa",
      location: "Adajan, Surat",
      price: 12500000,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=300&fit=crop",
      bedrooms: 4,
      bathrooms: 3,
      area: 2200,
      features: ["Garden", "Parking", "Security", "Modular Kitchen"],
      status: "Active"
    },
    {
      id: 1,
      title: "Luxury Apartment in City Center",
      type: "Apartment",
      location: "Surat City Center",
      price: 8500000,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      bedrooms: 3,
      bathrooms: 2,
      area: 1250,
      features: ["Swimming Pool", "Gym", "Parking", "Security"],
      status: "Active"
    },
    {
      id: 2,
      title: "Modern Villa with Garden",
      type: "Villa",
      location: "Adajan, Surat",
      price: 12500000,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=300&fit=crop",
      bedrooms: 4,
      bathrooms: 3,
      area: 2200,
      features: ["Garden", "Parking", "Security", "Modular Kitchen"],
      status: "Active"
    },
    {
      id: 1,
      title: "Luxury Apartment in City Center",
      type: "Apartment",
      location: "Surat City Center",
      price: 8500000,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
      bedrooms: 3,
      bathrooms: 2,
      area: 1250,
      features: ["Swimming Pool", "Gym", "Parking", "Security"],
      status: "Active"
    },
    {
      id: 2,
      title: "Modern Villa with Garden",
      type: "Villa",
      location: "Adajan, Surat",
      price: 12500000,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=300&fit=crop",
      bedrooms: 4,
      bathrooms: 3,
      area: 2200,
      features: ["Garden", "Parking", "Security", "Modular Kitchen"],
      status: "Active"
    },
  ];

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        const res = await getProfile();
        if (res.success) {
          setCurrentUser(res.data.user);
        }
      }
    } catch (error) {
      console.log("Error fetching user profile");
    }
  };

  const loadProperties = () => {
    setLoading(true);
    setTimeout(() => {
      setProperties(demoProperties);
      setFilteredProperties(demoProperties);
      setLoading(false);
    }, 1000);
  };

  const applyFiltersAndSearch = () => {
    let filtered = [...demoProperties];

    if (searchQuery) {
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.type?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.propertyType.length > 0) {
      filtered = filtered.filter(property =>
        filters.propertyType.includes(property.type)
      );
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter(property =>
        property.rating >= filters.minRating
      );
    }

    filtered = filtered.filter(property =>
      property.price >= filters.priceRange[0] && property.price <= filters.priceRange[1]
    );

    setFilteredProperties(filtered);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleLocationChange = (location) => {
    setUserLocation(location);
    setLocationVisible(false);
    Toast.show(`Location changed to ${location}`);
  };

  const formatPrice = (price) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${(price / 1000).toFixed(0)}K`;
  };

  const getPropertyChunks = () => {
    const chunks = [];
    for (let i = 0; i < filteredProperties.length; i += 9) {
      chunks.push(filteredProperties.slice(i, i + 9));
    }
    return chunks;
  };

  const resetFilters = () => {
    setFilters({
      propertyType: [],
      minRating: 0,
      priceRange: [0, 50000000],
    });
  };

  const handleApplyFilters = () => {
    applyFiltersAndSearch();
    setFilterVisible(false);
    Toast.show('Filters applied');
  };

  // Filter Modal Component
  const FilterModal = () => (
    <Modal
      visible={filterVisible}
      onClose={() => setFilterVisible(false)}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: '600' }}>Filter Properties</span>
          <Button fill="none" size="small" onClick={() => setFilterVisible(false)}>
            <CloseOutline />
          </Button>
        </div>
      }
      content={
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '8px' }}>Property Type</h4>
            <Selector
              options={propertyTypeOptions}
              value={filters.propertyType}
              onChange={value => setFilters(prev => ({ ...prev, propertyType: value }))}
              multiple
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '8px' }}>Minimum Rating</h4>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#1677ff' }}>{filters.minRating}+ Stars</span>
            </div>
            <Slider
              min={0}
              max={5}
              value={filters.minRating}
              onChange={value => setFilters(prev => ({ ...prev, minRating: value }))}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '8px' }}>Price Range</h4>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#1677ff' }}>
                {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
              </span>
            </div>
            <Slider
              range
              min={0}
              max={50000000}
              value={filters.priceRange}
              onChange={value => setFilters(prev => ({ ...prev, priceRange: value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button color="default" onClick={resetFilters} style={{ flex: 1 }}>
              Reset
            </Button>
            <Button color="primary" onClick={handleApplyFilters} style={{ flex: 1 }}>
              Apply
            </Button>
          </div>
        </div>
      }
    />
  );

  // Property Detail Modal
  const PropertyModal = () => (
    <Modal
      visible={!!selectedProperty}
      onClose={() => setSelectedProperty(null)}
      closeOnAction
      closeOnMaskClick
      actions={[
        {
          key: 'close',
          text: 'Close',
          primary: true,
        }
      ]}
      content={
        selectedProperty && (
          <div style={{ padding: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img
                src={selectedProperty.image}
                alt={selectedProperty.title}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  marginBottom: '12px'
                }}
              />
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{selectedProperty.title}</h2>
              <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{selectedProperty.type}</p>
              <Rate
                readOnly
                value={selectedProperty.rating || 0}
                style={{ margin: '8px 0' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Property Details</h4>
              <List style={{ '--font-size': '13px' }}>
                <List.Item prefix={<EnvironmentOutline />}>
                  {selectedProperty.location}
                </List.Item>
                <List.Item>
                  Price: {formatPrice(selectedProperty.price)}
                </List.Item>
                <List.Item>
                  {selectedProperty.bedrooms} BHK • {selectedProperty.bathrooms} Bath • {selectedProperty.area} sq.ft
                </List.Item>
                <List.Item>
                  Status: <Tag color="green" size="small">{selectedProperty.status}</Tag>
                </List.Item>
              </List>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '8px' }}>Features</h4>
              <Space wrap>
                {selectedProperty.features.map((feature, index) => (
                  <Tag key={index} color="blue" fill="outline" style={{ fontSize: '12px' }}>
                    {feature}
                  </Tag>
                ))}
              </Space>
            </div>

            <Space block>
              <Button color="primary" fill="solid" block size="large">
                Edit Property
              </Button>
            </Space>
          </div>
        )
      }
    />
  );

  useEffect(() => {
    loadProperties();
    fetchCurrentUser();
    fetchAdvertisements();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [searchQuery, filters]);

  const propertyChunks = getPropertyChunks();

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      backgroundImage: 'url("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Dark Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 0
      }}></div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HeaderWithSearch
          searchValue={searchQuery}
          setSearchValue={setSearchQuery}
          city={userLocation}
          setCity={setUserLocation}
        />

        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
            color: 'white'
          }}>
            <DotLoading color="primary" />
            <div style={{ marginTop: '12px', color: 'white' }}>Loading properties...</div>
          </div>
        ) : (
          <div style={{ padding: '12px', paddingBottom: '80px' }}>
            {filteredProperties.length === 0 ? (
              <Empty description="No properties found" />
            ) : (
              propertyChunks.map((chunk, chunkIndex) => (
                <div key={chunkIndex}>
                  {/* 3x3 Grid */}
                  <Grid columns={3} gap={8} style={{ marginBottom: '16px' }}>
                    {chunk.map((property) => (
                      <Grid.Item key={property.id}>
                        <Card
                          style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            padding: '8px'
                          }}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <img
                              src={property.image}
                              alt={property.title}
                              style={{
                                width: '100%',
                                height: '70px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                marginBottom: '6px'
                              }}
                            />
                            <div style={{
                              fontWeight: '600',
                              fontSize: '11px',
                              color: 'white',
                              marginBottom: '2px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {property.title}
                            </div>
                            <div style={{
                              fontSize: '9px',
                              color: 'rgba(255, 255, 255, 0.8)',
                              marginBottom: '4px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {property.type}
                            </div>
                            <Rate
                              readOnly
                              value={property.rating || 0}
                              style={{ '--star-size': '10px', marginBottom: '4px' }}
                            />
                            <div style={{
                              fontSize: '9px',
                              color: 'rgba(255, 255, 255, 0.9)',
                              marginBottom: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '2px'
                            }}>
                              <EnvironmentOutline style={{ fontSize: '8px' }} />
                              <Ellipsis content={property.location} row={1} />
                            </div>
                            <div style={{
                              fontSize: '9px',
                              color: 'rgba(255, 255, 255, 1)',
                              marginBottom: '4px'
                            }}>
                              {property.bedrooms} BHK • {property.area} sq.ft
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: '#1677ff',
                              fontWeight: '600',
                              marginBottom: '6px'
                            }}>
                              {formatPrice(property.price)}
                            </div>
                            <Button
                              size="mini"
                              color="primary"
                              fill="solid"
                              style={{ fontSize: '10px', height: '24px' }}
                              onClick={() => setSelectedProperty(property)}
                            >
                              View
                            </Button>
                          </div>
                        </Card>
                      </Grid.Item>
                    ))}
                  </Grid>

                  {/* Advertisement Component */}
                 
                  <AdvertisementManager
  advertisements={advertisements}
  onAdUpdate={fetchAdvertisements}
  isAdmin={isAdmin}
  chunkIndex={chunkIndex}
  positionId={chunkIndex} 
  pageKey="management" // This ensures each has separate functionality
  key={chunkIndex} // Add key prop for React reconciliation
/>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modals and Popups */}
      <FilterModal />
      <PropertyModal />
    </div>
  );
};

export default Settings;