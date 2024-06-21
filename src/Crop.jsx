import React, { useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import "react-easy-crop/react-easy-crop.css";
import { useNavigate } from 'react-router-dom';
import './Crop.css';
import getCroppedImg from './lib/cropImage';
import pixelateImg from "./lib/pixelate";
import { FaCheck } from 'react-icons/fa';


const Crop = ({ selectedImage, onPixelComplete, setAllColors, setStartX, setStartY, setXBlokcs, setYBlokcs }) => {
  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(50);
  const [blockSize, setBlockSize] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [pixelImg, setPixelImg] = useState(null);


  useEffect(() => {
    if (selectedImage) {
      createImage(selectedImage)
        .then(image => {
          // Convert image to data URL
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, image.width, image.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setImageSrc(dataUrl);
        })
        .catch(console.error);
    }
  }, [selectedImage]);

  useEffect(() => {
    if (croppedAreaPixels) {
      onCropComplete(null, croppedAreaPixels);
    }
  }, [blockSize]);


  const onCropComplete = async (croppedArea, croppedAreaPixels) => {
    console.log("crop completado")
    setCroppedAreaPixels(croppedAreaPixels);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      //setCroppedImg(croppedImage);

      const PixelObj = await pixelateImg(croppedImage, width, height, blockSize);
      onPixelComplete(PixelObj.imageURL);

      setAllColors(PixelObj.allColors);
      setXBlokcs(PixelObj.xBlocks);
      setYBlokcs(PixelObj.yBlocks);
      setStartX(croppedAreaPixels.x);
      setStartY(croppedAreaPixels.y);
            
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  const handleMapUpload = async () => {
    console.log("handleMapUpload",selectedDepthMap);
    try {
      // Fetch the depth map image from the URL
      const response = await fetch(selectedDepthMap);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      //console.log(arrayBuffer, pxImg, blockSize, xBlocks, yBlocks, startX, startY);
      // Process the depth map image
      pixelate16(arrayBuffer, pxImg, blockSize, xBlocks, yBlocks, startX, startY, (dataUrl, alturas) => {
        setPixelDepthUrl(dataUrl);
        setHeights(alturas);
      });
  
      // Convert blob to a data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setResultImageUrl(reader.result);
      };
      reader.readAsDataURL(blob);
  
    } catch (error) {
      console.error('Error loading depth map image:', error);
    }
  };

   return (
    <div className="new-screen-container">
      <div className="main-area">
        {imageSrc  && (
          <Cropper
          image={imageSrc }
          crop={crop}
          zoom={zoom}
          aspect={width / height}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          zoomSpeed={0.2}
        />
        )}
      </div>
      <div className="bottom-section">
        <div className="input-group">
          <label htmlFor="width">Ancho:</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="height">Alto:</label>
          <input
            type="number"            
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>        
      </div>
    </div>
  );
};

export default Crop;

async function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}
