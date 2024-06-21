import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { FaUpload, FaCheck } from 'react-icons/fa';
import pixelateImg from "./lib/pixelate";
import { useLocation } from 'react-router-dom';
import { pixelate16 } from './lib/pixel16';
import './App.css';
import { Paint3d } from './components/Paint3d';
import Crop from './Crop';
import ImageSidebar from './components/ImageSidebar';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

const App = () => {
  const location = useLocation();
  const { width, height, blockSize, croppedImg } = location.state || { width: 0, height: 0, blockSize: 1, croppedImg: null};
  const sceneRef = useRef(new THREE.Scene());
  const renderRef = useRef(new THREE.WebGLRenderer({ antialias: true }));
  const [pxImg, setPxImg] = useState(null)

  const [xBlocks, setXBlokcs] = useState(0);
  const [yBlocks, setYBlokcs] = useState(0);
  const [allColors, setAllColors] = useState(0);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  const [imageUrl, setImageUrl] = useState(null);
  const [pixelDepthUrl, setPixelDepthUrl] = useState(null);
  const [heights, setHeights] = useState([]);
  const [resultImageUrl, setResultImageUrl] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDepthMap, setSelectedDepthMap] = useState(null);
  

  const handleSelectImage = (image, depthMap) => {
    console.log("handleSelectImage",depthMap);
    setSelectedImage(image);
    setSelectedDepthMap(depthMap);
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
    <div className="app-container">
      <div className="sidebar">
        
        <div className="image-section">
          {pxImg && <img src={pxImg} alt="Pixelada" className="rightbar-image" />}
          <p>Pixelada</p>
        </div>
        <div className="image-section">
          {pixelDepthUrl && <img src={pixelDepthUrl} alt="Mapa Pixelado" className="rightbar-image" />}
          <p>Mapa Pixelado</p>
        </div>
        <button className="process-button" onClick={handleMapUpload}>
          <FaCheck /> Generar 3d
        </button>
      </div>
      <div className="canvas-container">
        <Tabs>
          <TabList>
            <Tab>Crop</Tab>
            <Tab>Paint3D</Tab>
          </TabList>
          <TabPanel>
            <Crop 
            selectedImage={selectedImage} 
            onPixelComplete={setPxImg}
            setAllColors={setAllColors}
            setStartX={setStartX}
            setStartY={setStartY}
            setXBlokcs = {setXBlokcs}
            setYBlokcs = {setYBlokcs}
            />
          </TabPanel>
          <TabPanel>
            <Paint3d 
              sceneRef={sceneRef.current}
              renderRef={renderRef.current}
              heights={heights}
              allColors={allColors}
              xBlocks={xBlocks}
              yBlocks={yBlocks}
              blockSizeInInches={blockSize}
            />
          </TabPanel>
        </Tabs>
      </div>
      <div className="rightbar">
        <ImageSidebar onSelectImage={handleSelectImage}/>
      </div>
    </div>
  );
};

export default App;


