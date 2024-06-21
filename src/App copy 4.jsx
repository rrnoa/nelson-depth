import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GodRaysDepthMaskShader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function App() {
  const canvasRef = useRef(null)
  useEffect(()=>{
    const ambientlight = new THREE.AmbientLight(0xffffff, 1);
    const width = window.innerWidth;
    const height = window.innerHeight;

    let scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    let camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2;

    let renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    canvasRef.current.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();			
		const displacementMap = textureLoader.load( 'mona_pred.png', (texture)=> {
      console.log("cargo textura");
    } );

    const mapColor = textureLoader.load( 'mona.png', (texture)=> {
      console.log("cargo textura");
    } );
    

    const geometry = new THREE.PlaneGeometry(1 , 1, 180, 180);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      map:mapColor,
      displacementMap: displacementMap,
      displacementScale: 1,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    scene.add(ambientlight);

    const controls = new OrbitControls(camera, renderer.domElement);
    //controls.minDistance = Math.max(5, Math.hypot(width, height)/4);
    controls.minDistance = 0.5;
    controls.maxDistance = 20;

    const animate = function () {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
  };
  
  animate();

  },[])
return (
  <>
  <div ref={canvasRef} style={{ width: '100%', height: '100%' }}>Paint3d</div>
  </>
)
}
export default App
