import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { FaUpload, FaCheck } from 'react-icons/fa';
import pixelateImg from "./lib/pixelate";
import { useLocation } from 'react-router-dom';
import { pixelate16 } from './lib/pixel16';
import './App.css';
import { Paint3d } from './components/Paint3d';
import Crop from './Crop';
import ImageSidebar from './components/ImageSidebar.jsx';

const App = () => {
  const location = useLocation();
  const { width, height, blockSize, croppedImg, pxImg, xBlocks, yBlocks, allColors, startX, startY } = location.state || { width: 0, height: 0, blockSize: 1, croppedImg: null, pxImg: null, xBlocks: 0, yBlocks: 0, allColors: [], startX: 0, startY: 0 };
  const sceneRef = useRef(new THREE.Scene());
  const renderRef =  useRef(new THREE.WebGLRenderer({ antialias: true}));

  const [imageUrl, setImageUrl] = useState(null);
  const [pixelDepthUrl, setPixelDepthUrl] = useState(null);
  const [heights, setHeights] = useState([]);
  const [resultImageUrl, setResultImageUrl] = useState(null);


  const handleMapUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        const arrayBuffer = e.target.result;
        pixelate16(arrayBuffer, pxImg, blockSize, xBlocks, yBlocks, startX, startY, (dataUrl, alturas)=>{
          setPixelDepthUrl(dataUrl);
          setHeights(alturas);          
        })
      };
      reader.readAsArrayBuffer(file);

      const reader2 = new FileReader();
      reader2.onloadend = async () => {
        setResultImageUrl(reader2.result);
      };
      reader2.readAsDataURL(file);

    }
  };

  return (
    
    <div className="app-container">
      <div className={`sidebar`}>
        <div className="upload-section">          
          {croppedImg && <img src={croppedImg} alt="Preview 1" className="preview-image" />}
        </div>
        <div className="upload-section">
          <input type="file" id="image2" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleMapUpload(e)} />
          <label htmlFor="image2" className="upload-button">
            <FaUpload /> Profundidad
          </label>
          {resultImageUrl && <img src={resultImageUrl} alt="Preview 2" className="preview-image" />}
        </div>

        <div className="image-section">
        {pxImg && <img src={pxImg} alt="Pixelada" className="rightbar-image" />}
          <p>Pixelada</p>
        </div>
        <div className="image-section">
          {pixelDepthUrl && <img src={pixelDepthUrl} alt="Mapa Pixelado" className="rightbar-image" />}
          <p>Mapa Pixelado</p>
        </div>
        
        <button className="process-button">
          <FaCheck /> Process
        </button>
      </div>
      <div className="canvas-container">
        <div id="mainCanvas">
          <Paint3d 
            sceneRef = {sceneRef.current}
            renderRef = {renderRef.current}
            heights = {heights}
            allColors = {allColors}
            xBlocks = {xBlocks}
            yBlocks = {yBlocks}
            blockSizeInInches={blockSize}
          ></Paint3d>
          <Crop></Crop>
        </div>
      </div>
      <div className="rightbar">
        <ImageSidebar/>        
      </div>
    </div>
  );
};

export default App;
