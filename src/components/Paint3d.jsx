import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import GUI from 'lil-gui';
import { configCamera, configLights, configRender, configControls } from './three-setup';
import { escalarPulgadas, smoothHeightMap } from '../lib/Filters';

export const Paint3d = ({ sceneRef, renderRef, heights, allColors, xBlocks, yBlocks, blockSizeInInches }) => {
    const [maxScaleFactor, setMaxScaleFactor] = useState(10);
    const [applyLogaritm, setApplyLogaritm] = useState(false);
    const [applyScale, setApplyScale] = useState(true);
    const [applyInch, setApplyInch] = useState(true);
    const [showGreen, setShowGreen] = useState(false);
    const [cutHeight, setCutHeight] = useState(0.65);
    const [delta, setDelta] = useState(0.25);
    const canvasRef = useRef(null);
    const guiRef = useRef(null);

    useEffect(() => {
        if (!guiRef.current) {
            guiRef.current = new GUI();
            const heightCutController = guiRef.current.add({ cutHeight }, 'cutHeight', 0, 1, 0.01);
            const maxScaleFactorController = guiRef.current.add({ maxScaleFactor }, 'maxScaleFactor', 1, 50, 1);
            const applyInchController = guiRef.current.add({ applyInch }, 'applyInch');
            const deltaController = guiRef.current.add({ delta }, 'delta', [0.25, 0.5, 1]);
            const applyScaleController = guiRef.current.add({ applyScale }, 'applyScale');
            const showGreenController = guiRef.current.add({ showGreen }, 'showGreen');
            guiRef.current.add({ applyChanges: () => applyChanges(heightCutController, maxScaleFactorController, applyScaleController, deltaController, applyInchController, showGreenController) }, 'applyChanges');
        }

        /* const width = window.innerWidth;
        const height = window.innerHeight; */
        const width = canvasRef.current?.offsetWidth;
		const height = canvasRef.current?.offsetHeight;

        configRender(renderRef, canvasRef.current, width, height);
        const camera = configCamera(width, height);
        const directionalLight = configLights();
        const controls = configControls(camera, renderRef);
        const ambientlight = new THREE.AmbientLight(0xffffff, 1);        
        sceneRef.background = new THREE.Color( 0xFBFBFC );

        
        sceneRef.add(ambientlight);
        sceneRef.add(directionalLight);

        const animate = function () {
            requestAnimationFrame(animate);
            controls.update();
            renderRef.render(sceneRef, camera);
        };

        animate();

        paintRelive(sceneRef, heights, allColors, xBlocks, yBlocks, cutHeight, blockSizeInInches, maxScaleFactor, applyScale, delta, applyInch, showGreen);

        return () => {
            console.log("desmontando");
            removeMeshesWithChildren(sceneRef);
            if (guiRef.current) {
                guiRef.current.destroy();
                guiRef.current = null;
            }
        };
    }, [heights, cutHeight, maxScaleFactor, applyLogaritm, applyScale, delta, applyInch, showGreen]);

    const applyChanges = (heightCutController, maxScaleFactorController, applyScaleController, deltaController, applyInchController, showGreenController) => {
        console.log("aplicando cambios...");
        setCutHeight(heightCutController.getValue());
        setMaxScaleFactor(maxScaleFactorController.getValue());
        setApplyScale(applyScaleController.getValue());
        setDelta(deltaController.getValue());
        setApplyInch(applyInchController.getValue());
        setShowGreen(showGreenController.getValue());
    };

    return (
        <>
            <div style={{position: 'fixed', top: '70px', color:'black'}}>Dimensiones: {xBlocks*blockSizeInInches}x{yBlocks*blockSizeInInches}---{blockSizeInInches}</div>
            <div ref={canvasRef} style={{ width: '70vw', height: '80vh', backgroundColor:'red'}}></div>
        </>
       
    );
};

const paintRelive = (scene, alturas, allColors, xBlocks, yBlocks, cutHeight, blockSizeInInches, maxScaleFactor, applyScale, delta, applyInch, showGreen) => {
    blockSizeInInches = blockSizeInInches * 0.0254;
    maxScaleFactor = maxScaleFactor * 0.0254;
    delta = delta * 0.0254;

    let heights = [...alturas];//copiar el arreglo de alturas
    let depthMin = Math.min(...heights);
    let depthMax = Math.max(...heights);  

    //invertir alturas 

    for (let index = 0; index < heights.length; index++) {
        heights[index] = depthMax - heights[index];        
    }

    //recortar las alturas
    for (let index = 0; index < heights.length; index++) {
        if ( heights[index] < cutHeight * depthMax) {
            heights[index] = cutHeight * depthMax;
        }       
    }

    if(applyScale) {
        console.log("aplicando Escala")
        depthMin = Math.min(...heights);
        depthMax = Math.max(...heights);
        for (let i = 0; i < heights.length; i++) {
            heights[i] = maxScaleFactor * (heights[i] - depthMin) / (depthMax - depthMin);
        }
    } else {
        console.log("Aplicando Escala normal")
        for (let index = 0; index < heights.length; index++) {
            heights[index] = (depthMax - heights[index]) * 0.004;
        }
    }
    //heights = smoothHeightMap(heights, xBlocks, yBlocks, 0.0254)
    
    if(applyInch) heights = escalarPulgadas(heights, maxScaleFactor, delta);


    console.log(Math.min(...heights), Math.max(...heights), heights.length, xBlocks, yBlocks);

    // Crear la geometría y material que se reutilizarán
const geometry = new THREE.BoxGeometry(blockSizeInInches, blockSizeInInches, 1);
let material;
if (allColors) {
    material = new THREE.MeshStandardMaterial();
} else {
    material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
}

// Crear el InstancedMesh con el número total de instancias
const count = xBlocks * yBlocks;
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

// Añadir sombras si es necesario
instancedMesh.castShadow = true;
instancedMesh.receiveShadow = true;

let instanceIndex = 0;
for (let j = 0; j < yBlocks; j++) {
    for (let i = 0; i < xBlocks; i++) {
        const height = heights[j * xBlocks + i];

        // Si hay colores especificados, actualizar el material
        if (allColors) {
            const color = new THREE.Color(`rgb(${allColors[j * xBlocks + i].join(",")})`);
            instancedMesh.setColorAt(instanceIndex, color);
        }

        // Crear la matriz de transformación
        const matrix = new THREE.Matrix4();
        matrix.compose(
            new THREE.Vector3(
                i * blockSizeInInches - xBlocks * blockSizeInInches / 2,
                (yBlocks - j - 1) * blockSizeInInches - yBlocks * blockSizeInInches / 2,
                height / 2
            ),
            new THREE.Quaternion(),
            new THREE.Vector3(1, 1, height) // Escalar en el eje Z
        );

        // Establecer la matriz de transformación para esta instancia
        instancedMesh.setMatrixAt(instanceIndex, matrix);
        instanceIndex++;
    }
}

// Añadir el InstancedMesh a la escena
scene.add(instancedMesh);

    if(showGreen) {
        const refgeometry = new THREE.BoxGeometry(0.0254, 0.0254, 0.254);
        const refMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const refMesh = new THREE.Mesh(refgeometry, refMaterial);
        refMesh.translateZ(0.254/2);
        scene.add(refMesh);
    }  

   
};


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
