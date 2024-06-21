import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function initThreeJS( canvasRef, heights, allColors, xBlocks, yBlocks ) {
    const blockSizeInInches = 0.0254;
    const width = window.innerWidth;
    const height = window.innerHeight;

    let scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    let camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    let renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowM
	renderer.shadowMap.enabled = true;
    canvasRef.appendChild(renderer.domElement);
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
    let shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    const helper = new THREE.DirectionalLightHelper( directionalLight, 5 );
    
    scene.add( helper );
    
    scene.add(shadowHelper);


    let ambientLight = new THREE.AmbientLight({intensity: 1});
    scene.add(directionalLight);
    scene.add(ambientLight);

    let controls = new OrbitControls(camera, renderer.domElement);

        const maxHeight = 0.254; // Establece un tope máximo de altura en pulgadas
        //const scaleFactor = 0.4;
        const maxScaleFactor = 0.254;
        let mayor = 0;
        const normalizedHeights = heights.map(height => {
        
            let adjustedHeight = maxScaleFactor - (height * (maxScaleFactor / 255));
        
            if(adjustedHeight > mayor) mayor = adjustedHeight;
            
            return adjustedHeight;
        });
    
    
        const normalizedHeightsExp = normalizedHeights.map(height => {
        
            let adjustedHeight = Math.pow(height, 0.1);
        
            return adjustedHeight;
        });   
    
        let material;
   
        for(let j = 0; j < yBlocks; j++) {
            for(let i = 0; i < xBlocks; i++) {

                //const height = borderPixels[j * xBlocks + i] == 1? colorHeightMap[j * xBlocks + i] - 0.5 : colorHeightMap[j * xBlocks + i];
                //const height = 255 - heights[j * xBlocks + i]
                const height = normalizedHeights[j * xBlocks + i]
                            
                const geometry = new THREE.BoxGeometry(blockSizeInInches, blockSizeInInches, height);                    
                //const geometry = new THREE.BoxGeometry(blockSizeInInches, blockSizeInInches, 1);    
                //allColors = null;                
                if(allColors) {
                    const color = `rgb(${allColors[j * xBlocks + i].join(",")})`;
                    material = new THREE.MeshStandardMaterial({ color: color });
                } else {
                    material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                }
        
                const cube = new THREE.Mesh(geometry, material);
                cube.castShadow = true;
                cube.receiveShadow = true;
                cube.position.set(i * blockSizeInInches - xBlocks * blockSizeInInches / 2, (yBlocks - j - 1) * blockSizeInInches - yBlocks * blockSizeInInches / 2, height/2);
                scene.add(cube);
            }
        }
    
    const animate = function () {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    
    animate();
    
}





export default initThreeJS;