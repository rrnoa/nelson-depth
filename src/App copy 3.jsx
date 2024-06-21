import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

import './App.css'
import initThreeJS from './components/Init3d';
import pixelateImg from "./lib/pixelate";
import ToggleVMState from './components/ChangeVMState';
import { resizeAndCompressImage } from './lib/ResizeImg';
import { pixelateImageLegacy } from './lib/pixelateLegazy';
import { Paint3d } from './components/Paint3d';

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

  const sceneRef = useRef(new THREE.Scene());
  const renderRef =  useRef(new THREE.WebGLRenderer({ antialias: true}));
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async function() {
        // El resultado está disponible en reader.result como un Data URL
        const blob = new Blob([reader.result], { type: file.type });
        // Hacer algo con el Blob, por ejemplo, mostrarlo en consola
        setImage(blob);
        const imgUrl = URL.createObjectURL(blob);
        setImageUrl(imgUrl);  // Crear una URL temporal para la imagen original
        const PixelOrigen = await pixelateImg(imgUrl);
        setAllColors(PixelOrigen.allColors);
        setPixelImageUrl(PixelOrigen.imageURL);
    };
      // Leer el archivo como un ArrayBuffer
    reader.readAsArrayBuffer(file);    

};

  const handleMapUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onloadend = async function() {
      // El resultado está disponible en reader.result como un Data URL
      const blob = new Blob([reader.result], { type: file.type });
      // Hacer algo con el Blob, por ejemplo, mostrarlo en consola
      const fileUrl = URL.createObjectURL(blob);
      setResultImageUrl(fileUrl);

      // Leer la imagen como un ImageData
      const image = new Image();
      image.src = fileUrl;
      
      
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const heights = extractHeightsFromImageData(imageData);
        console.log(heights);


        const { countMap, totalGroups } = countHeightOccurrencesAndTotalGroups(heights);
        console.log(countMap);
        console.log("Total de grupos diferentes:", totalGroups);
        console.log(heights.length);
    };
    };
    // Leer el archivo como un ArrayBuffer
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
        try {
            const response = await fetch(`https://149.36.1.177:5000/status/${taskId}`);
            if (!response.ok) {
                throw new Error(`Status check failed: ${response.statusText}`);
            }
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
        } catch (error) {
            console.error('Error checking status:', error);
            clearInterval(intervalId);
        }
    }, 5000); // Consultar cada 5 segundos
};




  return (
    <div className="App"> 
      <div>
        <div>Cambiar Estado de Máquina Virtual</div>
        <ToggleVMState />
      </div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        {
          imageUrl && (
            <div style={{border: '1px solid white'}}>
            <button type="submit">Generate Depth Map</button>
            <span style={{padding: '50px'}}>Ó</span>
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
        {/* {pixelDepthUrl && (
        <Paint3d 
          sceneRef = {sceneRef.current}
          renderRef = {renderRef.current}
          heights = {heights}
          allColors = {allColors}
          xBlocks = {xBlocks}
          yBlocks = {yBlocks}
        ></Paint3d>)} */}
      </div>
    </div>
  );
}

const extractHeightsFromImageData = (imageData) => {
  const heights = [];
  const data = imageData.data;

  // Asumiendo que los valores de profundidad están en los canales rojo (alto) y verde (bajo)
  for (let i = 0; i < data.length; i += 4) {
      // Extrayendo el valor de 16 bits combinando los canales rojo y verde
      const high = data[i];     // Rojo
      const low = data[i + 1];  // Verde
      const height = (high << 8) | low;
      heights.push(height);
  }

  return heights;
};

function countHeightOccurrencesAndTotalGroups(heights) {
  const countMap = {};
  let totalGroups = 0;

  // Recorre todas las alturas y cuenta las ocurrencias
  heights.forEach(height => {
      if (countMap.hasOwnProperty(height)) {
          countMap[height]++;
      } else {
          countMap[height] = 1;
          totalGroups++;  // Incrementa por cada nuevo grupo de altura encontrado
      }
  });

  return { countMap, totalGroups };
}



export default App
