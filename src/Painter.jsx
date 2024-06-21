import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { FaUpload, FaCheck } from 'react-icons/fa';
import pixelateImg from "./lib/pixelate";
import { pixelate16 } from './lib/pixel16';
import './App.css';
import { Paint3d } from './components/Paint3d';
import Crop from './Crop';
import ImageSidebar from './components/ImageSidebar';
import 'react-tabs/style/react-tabs.css';

const App = () => {
  const [show, setShow] = useState("crop");
  const blockSize = 1;
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
    setShow("crop");
  };

  const handleMapUpload = async () => {    
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
        console.log("handleMapUpload",selectedDepthMap);    
        console.log(alturas);
      });
  
      // Convert blob to a data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setResultImageUrl(reader.result);
        setShow("3d");

      };
      reader.readAsDataURL(blob);
  
    } catch (error) {
      console.error('Error loading depth map image:', error);
    }
  };


  return (
    <div className="app-container">
      
{/*       <div className="sidebar">
        
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
      </div> */}
      <div className="canvas-container">
        {show === 'crop' && selectedImage && <button className="process-button" onClick={handleMapUpload}>
          <FaCheck /> Generar 3d
        </button>}
          <div style={{width: '100%'}}>
            {show === "crop"? (
            <Crop 
            selectedImage={selectedImage} 
            onPixelComplete={setPxImg}
            setAllColors={setAllColors}
            setStartX={setStartX}
            setStartY={setStartY}
            setXBlokcs = {setXBlokcs}
            setYBlokcs = {setYBlokcs}
            />):
            (
            <Paint3d 
              sceneRef={sceneRef.current}
              renderRef={renderRef.current}
              heights={heights}
              allColors={allColors}
              xBlocks={xBlocks}
              yBlocks={yBlocks}
              blockSizeInInches={blockSize}
            />
            )}            
          </div>         
      </div>
      <div className="rightbar">
        <ImageSidebar onSelectImage={handleSelectImage}/>
      </div>
    </div>
  );
};

export default App;


