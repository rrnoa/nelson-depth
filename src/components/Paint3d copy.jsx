import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import GUI from 'lil-gui';
import { configCamera, configLights, configRender, configControls } from './three-setup';
import { FilterLogaritm } from '../lib/FilterLogaritm';
import { step } from 'three/examples/jsm/nodes/Nodes.js';

export const Paint3d = ({ sceneRef, renderRef, heights, allColors, xBlocks, yBlocks }) => {
    const [blockSizeInInches, setBlockSizeInInches] = useState(1);
    const [maxScaleFactor, setMaxScaleFactor] = useState(10);
    const [applyLogaritm, setApplyLogaritm] = useState(false);
    const [applyScale, setApplyScale] = useState(true);
    const canvasRef = useRef(null);
    const guiRef = useRef(null);

    useEffect(() => {
        if (!guiRef.current) {
            guiRef.current = new GUI();
            const blockSizeController = guiRef.current.add({ blockSizeInInches }, 'blockSizeInInches', 0.5, 3, 0.5);
            const maxScaleFactorController = guiRef.current.add({ maxScaleFactor }, 'maxScaleFactor', 1, 50, 1);
            const applyLogaritmController = guiRef.current.add({ applyLogaritm }, 'applyLogaritm');
            const applyScaleController = guiRef.current.add({ applyScale }, 'applyScale');
            guiRef.current.add({ applyChanges: () => applyChanges(blockSizeController, maxScaleFactorController, applyLogaritmController, applyScaleController) }, 'applyChanges');
        }

        console.log("----------------------useEffect Scene3d----------------------------");

        const width = window.innerWidth;
        const height = window.innerHeight;

        configRender(renderRef, canvasRef.current, width, height);
        const camera = configCamera(width, height);
        const directionalLight = configLights();
        const controls = configControls(camera, renderRef);
        const ambientlight = new THREE.AmbientLight(0xffffff, 1);
        let shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
        const helper = new THREE.DirectionalLightHelper(directionalLight, 5);

        sceneRef.add(helper);
        sceneRef.add(shadowHelper);
        sceneRef.add(ambientlight);
        sceneRef.add(directionalLight);

        const animate = function () {
            requestAnimationFrame(animate);
            controls.update();
            renderRef.render(sceneRef, camera);
        };

        animate();

        paintRelive(sceneRef, heights, allColors, xBlocks, yBlocks, blockSizeInInches, maxScaleFactor, applyLogaritm, applyScale);

        return () => {
            console.log("desmontando");
            removeMeshesWithChildren(sceneRef);
            if (guiRef.current) {
                guiRef.current.destroy();
                guiRef.current = null;
            }
        };
    }, [heights, blockSizeInInches, maxScaleFactor, applyLogaritm, applyScale]);

    const applyChanges = (blockSizeController, maxScaleFactorController, applyLogaritmController, applyScaleController) => {
        console.log("aplicando cambios...");
        setBlockSizeInInches(blockSizeController.getValue());
        setMaxScaleFactor(maxScaleFactorController.getValue());
        setApplyLogaritm(applyLogaritmController.getValue());
        setApplyScale(applyScaleController.getValue());
        console.log(applyScaleController.getValue());
    };

    return (
        <>
            <div style={{position: 'fixed', top: '10px'}}>Dimensiones: {xBlocks}x{yBlocks}</div>
            <div ref={canvasRef} style={{ width: '100%', height: '100%' }}>Paint3d</div>
        </>
       
    );
};

const paintRelive = (scene, alturas, allColors, xBlocks, yBlocks, blockSizeInInches, maxScaleFactor, applyLogaritm, applyScale) => {
    blockSizeInInches = blockSizeInInches * 0.0254;
    maxScaleFactor = maxScaleFactor * 0.0254;

    const steps =  0.0254; //altura entre bloques

    const maxHeight = 0.254; // Establece un tope máximo de altura en pulgadas
    let mayor = 0;
    let heights = [...alturas];//copiar el arreglo de alturas
    let depthMin = Math.min(...heights);
    let depthMax = Math.max(...heights);  


    if(applyLogaritm) {
        console.log("aplicando logaritmo")
        FilterLogaritm(heights, 0, maxScaleFactor);
    } else if(applyScale) {
        console.log("aplicando Escala")
        depthMin = Math.min(...heights);
        depthMax = Math.max(...heights);
        for (let i = 0; i < heights.length; i++) {
            heights[i] = maxScaleFactor - (maxScaleFactor * (heights[i] - depthMin) / (depthMax - depthMin));
        }
    } else {
        console.log("Aplicando Escala normal")
        for (let index = 0; index < heights.length; index++) {
            heights[index] = 1 - heights[index];
        }
    }

    const scaledMaxHeight = Math.max(...heights);//maxima altura despues de scalada
    const scaledMinHeight = Math.min(...heights);//minima altura despues de scalada

    const scaledRealHeight = scaledMaxHeight - scaledMinHeight; //la distancia entre el mayor y el menor

    console.log("scaledRealHeight->",scaledRealHeight);

    const cantCapas = scaledRealHeight / steps; //obtengo la cantidad de capas 

    //crear el arreglo de limites de capas, 1 + cantidad de capas
    let limitesCapas= [];
    for (let index = 0; index <= scaledRealHeight; index += steps) {
        limitesCapas.push(index);
    }

    const delta = 0.001;
    heights = reemplazarPosiciones(heights);

    let material;

    console.log("Max minimo", Math.min(...heights), Math.max(...heights));

    for (let j = 0; j < yBlocks; j++) {
        for (let i = 0; i < xBlocks; i++) {
            //const height = applyLogaritm ? maxScaleFactor - heights[j * xBlocks + i]: maxScaleFactor - heights[j * xBlocks + i];
            const height = heights[j * xBlocks + i];
            const geometry = new THREE.BoxGeometry(blockSizeInInches, blockSizeInInches, height);
            if (allColors) {
                const color = `rgb(${allColors[j * xBlocks + i].join(",")})`;
                material = new THREE.MeshStandardMaterial({ color: color });
            } else {
                material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            }

            const cube = new THREE.Mesh(geometry, material);
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.position.set(i * blockSizeInInches - xBlocks * blockSizeInInches / 2, (yBlocks - j - 1) * blockSizeInInches - yBlocks * blockSizeInInches / 2, height / 2);
            scene.add(cube);
        }
    }
};

function reemplazarPosiciones(alturas, step = 0.0254, delta = 0.001) {   
    console.log("alturas.length",alturas.length)
    const capas = 10;
    
    // Crear una copia del arreglo para no modificar el original
    let nuevoArregloCeros = [...alturas];
    let nuevoArregloSustituido = [...alturas];
    let maxAlturas = Math.max(...alturas);
    let valorNuevo = maxAlturas;
    for (let index = 0; index < capas; index++) {

        // Encontrar el valor máximo en el arreglo
        let valorMaximo = Math.max(...nuevoArregloCeros);
        //console.log("valorMaximo - step: ", valorMaximo - step);
        let umbral = valorMaximo - delta;        
        // Reemplazar los elementos que cumplen la condición con 0

        console.log("valorMaximo", valorMaximo)
        let sum = 0;
        for (let i = 0; i < nuevoArregloCeros.length; i++) {
            if (nuevoArregloCeros[i] >= umbral) {
                nuevoArregloCeros[i] = 0;
                nuevoArregloSustituido[i] = valorNuevo;
                sum ++;
            }
        }

        valorNuevo -= step;
        console.log(sum);
        
    }

    for (let index = 0; index < nuevoArregloCeros.length; index++) {
        if(nuevoArregloCeros[index] !== 0) nuevoArregloSustituido[index] = 0.0254;
        
    }
    return nuevoArregloSustituido;
}


const removeMeshesWithChildren = (obj) => {
    const children = [...obj.children];
    for (const child of children) {
        if (child instanceof THREE.Mesh) {
            removeMeshesWithChildren(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    for (const material of child.material) {
                        if (material.map) material.map.dispose();
                        if (material.metalnessMap) material.metalnessMap.dispose();
                        if (material.normalMap) material.normalMap.dispose();
                        material.dispose();
                    }
                } else {
                    if (child.material.map) child.material.map.dispose();
                    if (child.material.metalnessMap) child.material.metalnessMap.dispose();
                    if (child.material.normalMap) child.material.normalMap.dispose();
                    child.material.dispose();
                }
            }
            obj.remove(child);
        }
    }
};
