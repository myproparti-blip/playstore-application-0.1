// src/components/PropertyDetails.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Image,
  Tag,
  Button,
  Space,
  Grid,
  Divider,
  List,
  Rate,
  Toast,
  SpinLoading,
  Modal,
  Avatar,
  Badge,
} from 'antd-mobile';
import {
  EnvironmentOutline,
  PhoneFill,
  MessageOutline,
  LeftOutline,
  HeartOutline,
  SendOutline,
  UserOutline,
  StarOutline,
  CalendarOutline,
} from 'antd-mobile-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getPropertyById, toggleFavorite } from '../../services/properties';
import { getProfile } from '../../services/auth';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    fetchPropertyDetails();
    fetchCurrentUser();
  }, [id]);

  // In fetchPropertyDetails function
const fetchPropertyDetails = async () => {
  try {
    setLoading(true);
    const res = await getPropertyById(id);
    if (res.success) {
      setProperty(res.data);
      setIsFavorite(res.data.isFavorite || false);
    } else {
      Toast.show(res.error || 'Property not found');
      navigate('/PropertyListing'); // Change from '/properties'
    }
  } catch (error) {
    console.error('Error loading property:', error);
    Toast.show('Error loading property details');
    navigate('/PropertyListing'); // Change from '/properties'
  } finally {
    setLoading(false);
  }
};
  const fetchCurrentUser = async () => {
    try {
      const res = await getProfile();
      if (res.success) {
        setCurrentUser(res.data.user);
      }
    } catch (error) {
      console.log('Error fetching user profile');
    }
  };

  const handleFavoriteToggle = async () => {
    if (!currentUser) {
      Toast.show('Please login to add favorites');
      return;
    }

    try {
      const res = await toggleFavorite(id);
      if (res.success) {
        setIsFavorite(!isFavorite);
        Toast.show(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      }
    } catch (error) {
      Toast.show('Error updating favorite');
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
    return `₹${price.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleContactOwner = () => {
    if (!currentUser) {
      Toast.show('Please login to contact owner');
      return;
    }
    setContactModalVisible(true);
  };

  const handleShareProperty = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: property?.description,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      Toast.show('Link copied to clipboard!');
    }
  };

  const nextImage = () => {
    if (property?.images && property.images.length > 0) {
      setImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images && property.images.length > 0) {
      setImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <SpinLoading color="primary" />
      </div>
    );
  }

  if (!property) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Property not found</h3>
        <Button color="primary" onClick={() => navigate('/properties')}>
          Back to Properties
        </Button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '16px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button fill="none" onClick={() => navigate(-1)}>
            <LeftOutline />
          </Button>
          <h2 style={{ margin: 0, fontSize: '18px', flex: 1 }}>Property Details</h2>
          <Button fill="none" onClick={handleShareProperty}>
            <SendOutline />
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      <div style={{ height: '300px', position: 'relative', background: '#000' }}>
        {property.images && property.images.length > 0 ? (
          <>
            <Image
              src={property.images[imageIndex]}
              alt={property.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              fallback={
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px'
                }}>
                  🏠
                </div>
              }
            />
            {property.images.length > 1 && (
              <>
                <Button 
                  shape="rounded" 
                  fill="solid"
                  style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none'
                  }}
                  onClick={prevImage}
                >
                  ‹
                </Button>
                <Button 
                  shape="rounded" 
                  fill="solid"
                  style={{ 
                    position: 'absolute', 
                    right: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none'
                  }}
                  onClick={nextImage}
                >
                  ›
                </Button>
                <div style={{ 
                  position: 'absolute', 
                  bottom: '16px', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  {imageIndex + 1} / {property.images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px'
          }}>
            🏠
          </div>
        )}
        
        {/* <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <Space>
            <Button 
              shape="rounded" 
              color={isFavorite ? "danger" : "default"} 
              fill="solid"
              onClick={handleFavoriteToggle}
            >
              <HeartOutline />
            </Button>
          </Space>
        </div> */}
        
        <div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
          <Space>
            <Tag color={property.listingType === 'Sale' ? 'red' : 'blue'}>
              {property.listingType}
            </Tag>
            {property.isVerified && <Tag color="green">Verified</Tag>}
          </Space>
        </div>
      </div>

      {/* Property Info */}
      <div style={{ padding: '16px' }}>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
              {property.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <EnvironmentOutline style={{ color: '#666' }} />
              <span style={{ color: '#666' }}>
                {[property.locality, property.city, property.state].filter(Boolean).join(', ')}
              </span>
            </div>
            <h2 style={{ margin: '0', color: '#ff4d4f', fontSize: '24px', fontWeight: 'bold' }}>
              {formatPrice(property.price)}
              {property.negotiable && (
                <Tag color="green" style={{ marginLeft: '8px', fontSize: '12px' }}>
                  Negotiable
                </Tag>
              )}
            </h2>
            {property.createdAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: '#666' }}>
                <CalendarOutline />
                <span>Listed on {formatDate(property.createdAt)}</span>
              </div>
            )}
          </div>

          <Divider />

          {/* Key Features */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '12px' }}>Key Features</h3>
            <Grid columns={2} gap={8}>
              {property.bedrooms && (
                <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Bedrooms</div>
                  <div style={{ fontWeight: '600' }}>{property.bedrooms}</div>
                </div>
              )}
              {property.bathrooms && (
                <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Bathrooms</div>
                  <div style={{ fontWeight: '600' }}>{property.bathrooms}</div>
                </div>
              )}
              {property.carpetArea && (
                <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Carpet Area</div>
                  <div style={{ fontWeight: '600' }}>{property.carpetArea} sq.ft</div>
                </div>
              )}
              {property.furnishing && (
                <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Furnishing</div>
                  <div style={{ fontWeight: '600' }}>{property.furnishing}</div>
                </div>
              )}
              {property.propertyType && (
                <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Property Type</div>
                  <div style={{ fontWeight: '600' }}>{property.propertyType}</div>
                </div>
              )}
              {property.constructionStatus && (
                <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Construction</div>
                  <div style={{ fontWeight: '600' }}>{property.constructionStatus}</div>
                </div>
              )}
            </Grid>
          </div>

          {/* Description */}
          {property.description && (
            <>
              <Divider />
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '8px' }}>Description</h3>
                <p style={{ lineHeight: '1.6', color: '#666' }}>{property.description}</p>
              </div>
            </>
          )}

          {/* Amenities */}
          {(property.parking || property.balcony || property.swimmingPool || property.gym || property.security) && (
            <>
              <Divider />
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>Amenities</h3>
                <Space wrap>
                  {property.parking && <Tag color="blue">Parking</Tag>}
                  {property.balcony && <Tag color="green">Balcony</Tag>}
                  {property.swimmingPool && <Tag color="orange">Swimming Pool</Tag>}
                  {property.gym && <Tag color="purple">Gym</Tag>}
                  {property.security && <Tag color="red">Security</Tag>}
                </Space>
              </div>
            </>
          )}
        </Card>

        {/* Contact Section */}
        <Card style={{ marginTop: '16px' }}>
          <h3 style={{ marginBottom: '12px' }}>Contact {property.owner?._id === currentUser?._id ? 'You' : 'Owner'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Avatar src={property.owner?.avatar} style={{ '--size': '50px' }}>
              <UserOutline />
            </Avatar>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600' }}>{property.owner?.name || 'Property Owner'}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {property.owner?._id === currentUser?._id ? 'Your Listing' : 'Verified Seller'}
              </div>
              {property.owner?.rating && (
                <Rate readOnly value={property.owner.rating} style={{ '--star-size': '14px' }} />
              )}
            </div>
          </div>
          
          {property.owner?._id === currentUser?._id ? (
            <div style={{ textAlign: 'center', padding: '20px', background: '#f0f8ff', borderRadius: '8px' }}>
              <p style={{ color: '#1890ff', margin: 0 }}>This is your property listing</p>
              <Button 
                color="primary" 
                fill="outline" 
                style={{ marginTop: '12px' }}
                onClick={() => navigate('/my-properties')}
              >
                Manage Your Properties
              </Button>
            </div>
          ) : (
            <Space block>
              <Button 
                color="primary" 
                block 
                size="large"
                onClick={handleContactOwner}
              >
                <PhoneFill /> Call Now
              </Button>
              <Button 
                color="success" 
                block 
                size="large"
                onClick={handleContactOwner}
              >
                <MessageOutline /> Message
              </Button>
            </Space>
          )}
        </Card>
      </div>

      {/* Contact Modal */}
      <Modal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        title={`Contact ${property.owner?.name || 'Owner'}`}
        content={
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Avatar src={property.owner?.avatar} style={{ '--size': '80px', margin: '0 auto 16px' }}>
              <UserOutline />
            </Avatar>
            <h3>{property.owner?.name || 'Property Owner'}</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Contact the owner for more details about this property
            </p>
            <Space direction="vertical" block>
              <Button color="primary" size="large" block>
                <PhoneFill /> Call: {property.owner?.phone || '+91 XXXXX XXXXX'}
              </Button>
              <Button color="success" size="large" block>
                <MessageOutline /> Send Message
              </Button>
            </Space>
          </div>
        }
      />

      {/* Fixed Bottom Action Bar */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        background: 'white', 
        padding: '16px', 
        borderTop: '1px solid #f0f0f0',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
      }}>
        <Space block>
          {/* <Button 
            color="primary" 
            fill="outline"
            onClick={handleFavoriteToggle}
          >
            <HeartOutline style={{ color: isFavorite ? '#ff4d4f' : undefined }} />
            {isFavorite ? 'Saved' : 'Save'}
          </Button> */}
          <Button 
            color="primary" 
            fill="solid"
            onClick={handleContactOwner}
          >
            Contact Owner
          </Button>
        </Space>
      </div>

      {/* Add padding to account for fixed bottom bar */}
      <div style={{ height: '80px' }}></div>
    </div>
  );
};

export default PropertyDetails;