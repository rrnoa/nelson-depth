import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";


export const configCamera = (paintAreaWidth, paintAreaHeight) => {
    const camera = new THREE.PerspectiveCamera(45, paintAreaWidth / paintAreaHeight, 0.1, 100);
    camera.position.z = 5;
    camera.updateProjectionMatrix();
    return camera;
}

export const configRender = (renderer, mount, paintAreaWidth, paintAreaHeight) => {
    renderer.setSize(paintAreaWidth, paintAreaHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    //renderer.shadowMap.type = THREE.PCFSoftShadowMap;					
    //renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    renderer.toneMappingExposure = 1;
    //renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);
}

export const configLights = () => {
    let directionalLight = new THREE.DirectionalLight({intensity: 4});
    directionalLight.castShadow = true;
    directionalLight.position.x = 1.5;
    directionalLight.position.y = 2;
    directionalLight.position.z = 2;
    directionalLight.shadow.camera.far = 5;
    directionalLight.shadow.camera.top = 2;
    directionalLight.shadow.camera.left = -2 ;
    directionalLight.shadow.camera.right = 2;
    directionalLight.shadow.camera.bottom = -2;

    return directionalLight;
    
}

export const configControls = (camera, renderer) => {
    //config cotrols
    const controls = new OrbitControls(camera, renderer.domElement);
    //controls.minDistance = Math.max(5, Math.hypot(width, height)/4);
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    
    controls.update();

    return controls;
}

export const animate = (renderer, scene, camera, width, height, setProductImg, snapshot, countAnimate) => {
    let frameId;
    function animation() {
      frameId = requestAnimationFrame(animation);
      renderer.render(scene, camera);
        if(countAnimate === 0){
            snapshot(renderer, width, height, setProductImg);
            countAnimate ++;
        }
    }
    animation();

    return () => {
        cancelAnimationFrame(frameId);
    };
};

