import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Toast,
  Modal,
  Selector,
  ImageViewer,
  Swiper,
  Badge,
} from "antd-mobile";
import {
  AddOutline,
  DeleteOutline,
  CloseOutline,
} from "antd-mobile-icons";
import { advertisementService } from "../../services/advertise";

const AdvertisementManager = ({
  advertisements = [],
  onAdUpdate,
  isAdmin,
  chunkIndex,
  positionId,
  pageKey
}) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadType, setUploadType] = useState("multiple");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localAd, setLocalAd] = useState(null);
  // 1. Add new state for loading indicator
  const [isUploading, setIsUploading] = useState(false);

  const videoRefs = useRef({});

  // Improved ad selection logic to prevent duplicate ads
  // In AdvertisementManager.jsx - Update the useEffect
  useEffect(() => {
    console.log('AdvertisementManager Debug:', {
      totalAds: advertisements.length,
      pageKey,
      positionId,
      allAds: advertisements
    });

    // Filter ads by both pageKey AND positionId
    const filteredAds = advertisements.filter(ad => {
      if (!ad) return false;

      console.log('Checking ad:', {
        adId: ad._id,
        adPageKey: ad.pageKey,
        targetPageKey: pageKey,
        adPosition: ad.position,
        targetPosition: positionId,
        hasUrl: !!ad.url,
        hasFiles: Array.isArray(ad.files) && ad.files.length > 0,
        type: ad.type
      });

      // Check BOTH pageKey AND position match
      const pageKeyMatch = ad.pageKey === pageKey;
      const positionMatch = Number(ad.position) === Number(positionId);

      // Check if ad has content
      const hasContent = ad.url || (Array.isArray(ad.files) && ad.files.length > 0);

      return pageKeyMatch && positionMatch && hasContent;
    });

    console.log('Filtered ads for page', pageKey, 'position', positionId, ':', filteredAds);

    // Use the first matching ad or null
    setLocalAd(filteredAds[0] || null);
  }, [advertisements, positionId, pageKey]);

  const uploadTypeOptions = [
    { label: "Single Photo", value: "image" },
    { label: "Single Video", value: "video" },
    { label: "Multiple Files", value: "multiple" },
  ];

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (uploadType === "image") {
      const image = files.find(f => f.type.startsWith("image/"));
      if (!image) return Toast.show("Select a valid image");
      setSelectedFiles([image]);
    } else if (uploadType === "video") {
      const video = files.find(f => f.type.startsWith("video/"));
      if (!video) return Toast.show("Select a valid video");
      setSelectedFiles([video]);
    } else {
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      Toast.show("Please select files first");
      return;
    }
    
    // 2. Set loading state to true
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("position", positionId.toString());
      formData.append("pageKey", pageKey);

      if (uploadType === "image") {
        formData.append("image", selectedFiles[0]);
        await advertisementService.uploadImage(formData);
      } else if (uploadType === "video") {
        formData.append("video", selectedFiles[0]);
        await advertisementService.uploadVideo(formData);
      } else {
        selectedFiles.forEach(file => formData.append("files", file));
        await advertisementService.uploadMultiple(formData);
      }

      Toast.show("Advertisement uploaded successfully");
      setUploadModalVisible(false);
      setSelectedFiles([]);
      onAdUpdate?.();
    } catch (err) {
      console.error(err);
      Toast.show("Upload failed");
    } finally {
      // 2. Set loading state to false after success or failure
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await advertisementService.deleteAdvertisement(id);
      Toast.show("Deleted successfully");
      onAdUpdate?.();
    } catch (e) {
      console.error(e);
      Toast.show("Failed to delete");
    }
  };

  const getFilesArray = (ad) => {
    if (ad?.type === "multiple" && Array.isArray(ad.files))
      return ad.files.filter(f => f.url || f);
    return [];
  };

  const getFileUrl = (file) =>
    typeof file === "string" ? file : file.url || file;

  const getFileType = (file) => {
    const url = getFileUrl(file);
    return /\.(mp4|webm|ogg|mov|avi)$/i.test(url) ? "video" : "image";
  };

  const openImageViewer = (index) => {
    setCurrentImageIndex(index);
    setImageViewerVisible(true);
  };

  // Function to generate default property-related image based on card size
  const getDefaultPropertyImage = (width = 300, height = 200) => {
    const colors = ['4A90E2', '50C878', 'FF6B6B', '9B59B6', 'E67E22'];
    const color = colors[positionId % colors.length];

    const propertyIcons = ['🏠', '🏢', '🏨', '🏪', '🏛️', '🏬'];
    const icon = propertyIcons[positionId % propertyIcons.length];

    // Use dummyimage.com instead
    return `https://dummyimage.com/${width}x${height}/${color}/ffffff&text=${encodeURIComponent(icon + ' Property Ad ' + positionId)}`;
  };

  const AdvertisementCard = ({ ad }) => {
    const hasContent = ad && (ad.url || (ad.files && ad.files.length > 0));
    const files = getFilesArray(ad);
    const hasMultiple = files.length > 1;
    const swiperRef = useRef(null);
    const videoRefs = useRef({});
    const imageTimeouts = useRef({});

    // Clear timeouts on unmount
    useEffect(() => {
      return () => {
        Object.values(imageTimeouts.current).forEach(clearTimeout);
      };
    }, []);

    // Handle video ended event - auto advance to next slides
    const handleVideoEnded = (currentIndex) => {
      if (swiperRef.current && files.length > 1) {
        // Move to next slide when video ends
        const nextIndex = (currentIndex + 1) % files.length;
        swiperRef.current.swipeTo(nextIndex);
      } else if (swiperRef.current && files.length === 1) {
        // If only one video, restart it
        videoRefs.current[currentIndex].currentTime = 0;
        videoRefs.current[currentIndex].play();
      }
    };

    // Auto-play current video when slide changes
    const handleSlideChange = (index) => {
      // Clear any existing timeouts
      Object.values(imageTimeouts.current).forEach(clearTimeout);
      imageTimeouts.current = {};

      const currentFile = files[index];
      if (getFileType(currentFile) === "video" && videoRefs.current[index]) {
        const video = videoRefs.current[index];
        video.currentTime = 0; // Reset to beginning
        video.play().catch(e => console.log('Auto-play prevented:', e));
      } else if (getFileType(currentFile) === "image" && files.length > 1) {
        // Set timeout for image auto-advance
        imageTimeouts.current[index] = setTimeout(() => {
          if (swiperRef.current) {
            const nextIndex = (index + 1) % files.length;
            swiperRef.current.swipeTo(nextIndex);
          }
        }, 5000); // 5 seconds for images
      }
    };

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "200px",
          marginBottom: "16px",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          background: "white",
        }}
      >
        {isAdmin && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 10,
              display: "flex",
              gap: "4px",
            }}
          >
            <Button
              size="mini"
              color="primary"
              onClick={() => setUploadModalVisible(true)}
            >
              <AddOutline />
            </Button>
            {ad?._id && (
              <Button
                size="mini"
                color="danger"
                onClick={() => handleDelete(ad._id)}
              >
                <DeleteOutline />
              </Button>
            )}
          </div>
        )}

        {!hasContent ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              border: "2px dashed rgba(0,0,0,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(0,0,0,0.7)",
              cursor: isAdmin ? "pointer" : "default",
              background: "#f9f9f913",
              position: "relative",
              overflow: "hidden",
            }}
            onClick={() => isAdmin && setUploadModalVisible(true)}
          >
            {/* Default Property Image */}
            <img
              src={getDefaultPropertyImage(300, 200)}
              alt="Default Property Advertisement"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.7,
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />

            {/* Overlay with Add button */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.8)",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              <AddOutline style={{ fontSize: "28px", marginBottom: "4px" }} />
              <span style={{ marginLeft: "6px", fontWeight: "bold" }}>
                {isAdmin ? "Add Advertisement" : ""}
              </span>

            </div>
          </div>
        ) : ad.type === "multiple" && files.length > 0 ? (
          <Swiper
            ref={swiperRef}
            autoplay={false} // Disable Swiper autoplay, we handle it manually
            loop={false} // Disable loop since we handle it manually
            allowTouchMove={false} // Disable manual sliding
            key={files.map(f => getFileUrl(f)).join(",")}
            indicator={(total, current) => (
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: "4px",
                  zIndex: 5,
                }}
              >
                {Array.from({ length: total }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background:
                        current === i
                          ? "#1677ff"
                          : "rgba(255,255,255,0.5)",
                    }}
                  />
                ))}
              </div>
            )}
            onIndexChange={handleSlideChange}
            defaultIndex={0} // Start from first slide
          >
            {files.map((file, idx) => (
              <Swiper.Item key={idx}>
                {getFileType(file) === "image" ? (
                  <img
                    src={getFileUrl(file)}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                      background: "#f5f5f5",
                    }}
                    alt={`Advertisement ${idx + 1}`}
                    onLoad={() => {
                      // For the first image, start the timer immediately
                      if (idx === 0 && files.length > 1) {
                        imageTimeouts.current[idx] = setTimeout(() => {
                          if (swiperRef.current) {
                            const nextIndex = (idx + 1) % files.length;
                            swiperRef.current.swipeTo(nextIndex);
                          }
                        }, 5000);
                      }
                    }}
                  />
                ) : (
                  <video
                    ref={(el) => (videoRefs.current[idx] = el)}
                    src={getFileUrl(file)}
                    style={{
                      width: "100%",
                      height: "200px",
                      background: "#000",
                      objectFit: "cover",
                    }}
                    autoPlay={idx === 0} // Auto-play first video
                    muted
                    playsInline
                    onEnded={() => handleVideoEnded(idx)}
                    onError={(e) => {
                      console.error('Video error:', e);
                      // If video fails to load, auto-advance after 2 seconds
                      setTimeout(() => {
                        if (swiperRef.current && files.length > 1) {
                          const nextIndex = (idx + 1) % files.length;
                          swiperRef.current.swipeTo(nextIndex);
                        }
                      }, 2000);
                    }}
                  />
                )}
              </Swiper.Item>
            ))}
          </Swiper>
        ) : ad.type === "video" ? (
          <video
            src={ad.url}
            style={{
              width: "100%",
              height: "100%",
              background: "#000",
              objectFit: "cover",
            }}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={ad.url}
            alt="Advertisement"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              background: "#f5f5f5",
            }}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <AdvertisementCard ad={localAd} />

      <Modal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        bodyStyle={{
          maxHeight: '60vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        content={
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}>
            {/* Fixed Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                borderBottom: "1px solid #f0f0f0",
                flexShrink: 0,
              }}
            >
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                Upload Advertisement (Position {positionId})
              </span>
              <Button
                fill="none"
                size="small"
                onClick={() => setUploadModalVisible(false)}
              >
                <CloseOutline />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '19px',
              WebkitOverflowScrolling: 'touch'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px' }}>Select Upload Type</h4>
                <Selector
                  options={uploadTypeOptions}
                  value={[uploadType]}
                  onChange={(v) => setUploadType(v[0])}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px' }}>Select Files</h4>
                <input
                  type="file"
                  multiple={uploadType === "multiple"}
                  accept={
                    uploadType === "image"
                      ? "image/*"
                      : uploadType === "video"
                        ? "video/*"
                        : "image/*,video/*"
                  }
                  onChange={handleFileSelect}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d9d9d938',
                    borderRadius: '6px'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {uploadType === "image" && "Select one image file"}
                  {uploadType === "video" && "Select one video file"}
                  {uploadType === "multiple" && "Select multiple image/video files"}
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ marginBottom: '8px' }}>
                    Preview ({selectedFiles.length})
                  </h4>
                  <div style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {selectedFiles.map((file, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            style={{
                              width: 80,
                              height: 80,
                              borderRadius: 8,
                              objectFit: "cover",
                            }}
                            alt={`Preview ${i + 1}`}
                          />
                        ) : (
                          <div
                            style={{
                              width: 80,
                              height: 80,
                              background: "#eeeeee5e",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: '12px',
                              color: '#666'
                            }}
                          >
                            📹 Video
                          </div>
                        )}
                        <Button
                          size="mini"
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            background: "#ff4d4f",
                            borderRadius: "50%",
                            color: "#fff",
                            width: '20px',
                            height: '20px',
                            minWidth: '20px',
                            padding: 0
                          }}
                          onClick={() =>
                            setSelectedFiles((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                        >
                          <CloseOutline fontSize={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Footer with Buttons */}
            <div style={{
              padding: "16px",
              borderTop: "1px solid #ababab3b",
              flexShrink: 0,
              display: 'flex',
              gap: '8px'
            }}>
              <Button
                style={{ flex: 1 }}
                onClick={() => setUploadModalVisible(false)}
                // 3. Disable cancel button while uploading
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                style={{ flex: 1 }}
                onClick={handleUpload}
                // 3. Disable button if no files selected OR if currently uploading
                disabled={selectedFiles.length === 0 || isUploading}
                // 3. Show loading spinner
                loading={isUploading}
                // 3. Change button text while loading
                loadingText="Uploading..."
              >
                {/* 3. Button text */}
                {isUploading ? 'Uploading' : 'Upload'}
              </Button>
            </div>
          </div>
        }
      />

      {localAd?.url && (
        <ImageViewer
          image={localAd.url}
          visible={imageViewerVisible}
          onClose={() => setImageViewerVisible(false)}
        />
      )}
    </>
  );
};

export default AdvertisementManager;