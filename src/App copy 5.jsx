import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import UPNG from 'upng-js';


import './App.css'
import initThreeJS from './components/Init3d';
import pixelateImg from "./lib/pixelate";
import ToggleVMState from './components/ChangeVMState';
import { resizeAndCompressImage } from './lib/ResizeImg';
//import { pixelateImageLegacy } from './lib/pixelateLegazy';
import { pixelate16 } from './lib/pixel16';
import { Paint3d } from './components/Paint3d';
import { fromArrayBuffer } from 'geotiff';

function App() {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [resultImageUrl, setResultImageUrl] = useState(null);
  const [pixelImageUrl, setPixelImageUrl] = useState(null);
  const [pixelDepthUrl, setPixelDepthUrl] = useState(null);
  const [heights, setHeights] = useState([]);
  const [allColors, setAllColors] = useState([]);
  const [xBlocks, setXBlocks] = useState(0);
  const [yBlocks, setYBlocks] = useState(0);

  const dpi = 72/4;
  const maxWidth = 1024 * 2;
  const maxHeight = 1024 * 2;

  const sceneRef = useRef(new THREE.Scene());
  const renderRef =  useRef(new THREE.WebGLRenderer({ antialias: true}));
  
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async (e) => {      
        setImageUrl(reader.result);  // Crear una URL temporal para la imagen original

        const PixelOrigen = await pixelateImg(reader.result, 1, dpi);
        setXBlocks(PixelOrigen.xBlocks);
        setYBlocks(PixelOrigen.yBlocks);
        setAllColors(PixelOrigen.allColors);
        setPixelImageUrl(PixelOrigen.imageURL);    
     
    }
    reader.readAsDataURL(file);

    // Convert the image to a Blob
    const readerForBlob = new FileReader();
    readerForBlob.onloadend = () => {
      const blob = new Blob([readerForBlob.result], { type: file.type });
      setImage(blob);
    };
    readerForBlob.readAsArrayBuffer(file);

  };

  const handleMapUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }
    const reader = new FileReader();

    reader.onloadend = (e) => {
      const arrayBuffer = e.target.result;
      pixelate16(arrayBuffer, pixelImageUrl, 1, dpi, xBlocks, yBlocks, (dataUrl, alturas)=>{
        setResultImageUrl(dataUrl);
        setHeights(alturas);
        
      })
    };
    reader.readAsArrayBuffer(file);      
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!image) return;

    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await fetch('https://149.36.1.177:5000/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setTaskId(data.task_id);
      setStatus('PENDING');
      checkStatus(data.task_id);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const checkStatus = async (taskId) => {
    let intervalId = setInterval(async () => {
      const response = await fetch(`https://149.36.1.177:5000/status/${taskId}`);
      const data = await response.json();
      setStatus(data.state);

      if (data.state === 'SUCCESS') {
        let resultUrl = `https://149.36.1.177:5000/result/${taskId}`;
        setResultImageUrl(resultUrl); 
        pixelateImageLegacy(resultUrl, 1, (alturas, xBlocks, yBlocks, pixelDepth) => {
          console.log("callback:", xBlocks, yBlocks)
          setHeights(alturas);
          setPixelDepthUrl(pixelDepth);
          setXBlocks(xBlocks);
          setYBlocks(yBlocks);
        }); 
        clearInterval(intervalId);
      } else if (data.state === 'FAILURE') {
        setStatus('FAILED');
        clearInterval(intervalId);
      }
    }, 5000); // Consultar cada 5 segundos
  };



  return (
    <div className="App"> 
      <div style={{position: 'absolute', left:0, top: 0, backgroundColor: '#af2183'}}>
        <div>Cambiar Estado de Máquina Virtual</div>
        <ToggleVMState />
      </div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {
          /* imageUrl && (
            <div style={{border: '1px solid white'}}>
            <button type="submit">Generate Depth Map</button>
            <span style={{padding: '50px'}}>Ó</span>
            <input type="file" accept="image/*" onChange={handleMapUpload} />
            </div>
            
          ) */
          true && (
            <div style={{border: '1px solid white'}}>
            <button type="submit">Generate Depth Map</button>
            <span style={{padding: '0 50px'}}>Ó</span>
            <input type="file" accept="image/*" onChange={handleMapUpload} />
            </div>
            
          )
        }
      </form>
      {status && <p>Status: {status}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
        {imageUrl && (
          <div>
            <h2>Original Image</h2>
            <img src={imageUrl} alt="Original" style={{ maxWidth: '200px', maxHeight: '200px' }} />
          </div>
        )}
        {pixelImageUrl && (
          <div>
            <h2>Pixel Image</h2>
            <img src={pixelImageUrl} alt="Original" style={{ maxWidth: '200px', maxHeight: '200px' }} />
          </div>
        )}
        {resultImageUrl && (
          <div>
            <h2>Inference Result</h2>
            <img src={resultImageUrl} alt="Result" style={{ maxWidth: '200px', maxHeight: '200px' }} />
          </div>
        )}        
        {pixelDepthUrl && (
          <div>
            <h2>Result Pixelated</h2>
            <img src={pixelDepthUrl} alt="Result" style={{ maxWidth: '200px', maxHeight: '200px' }} />
          </div>
        )}     
      </div>
      <div>
        <h2>Relieve</h2>        
        <Paint3d 
          sceneRef = {sceneRef.current}
          renderRef = {renderRef.current}
          heights = {heights}
          allColors = {allColors}
          xBlocks = {xBlocks}
          yBlocks = {yBlocks}
        ></Paint3d>
      </div>
    </div>
  );
}
export default App
