import kmeans from "./kmeans";
import EXIF from 'exif-js';


export default function pixelateImg(croppedImageSrc, xBlocks, yBlocks, blockSize ) {  

  xBlocks = xBlocks / blockSize; // si son 0.5 pulgadas entonces es el doble de bloqes
  yBlocks = yBlocks / blockSize;
  // Set canvas size
  return new Promise((resolve, reject) => {
    const croppedImage = new Image();
    croppedImage.src = croppedImageSrc;

    croppedImage.onload = () => {
      let ctxSettings = {
        willReadFrequently: true,
        mozImageSmoothingEnabled: false,
        webkitImageSmoothingEnabled: false,
        imageSmoothingEnabled: false,
      };

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", ctxSettings);

      let croppedWidth = croppedImage.width;
      let croppedHeight = croppedImage.height;

      let blockPixelSize = Math.floor(croppedWidth / xBlocks);

      const correctImgWidth = blockPixelSize * xBlocks;//la Longitudes ajustas
      const correctImgHeight = blockPixelSize * yBlocks;//la Longitudes ajustas

      canvas.width = correctImgWidth;
      canvas.height = correctImgHeight;     

      // Draw initial image (en el canvas que esta oculto se dibuja la image con crop)
      ctx.drawImage(
        croppedImage,
        0,
        0,
        correctImgWidth,
        correctImgHeight,
        0,
        0,
        correctImgWidth,
        correctImgHeight
      );
      let allColors = [];
      // Get image data in form of array of pixels (RGBA) not array of arrays
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const imData = imageData.data;
      // Calculate average color of each block

      for (let y = 0; y < correctImgHeight; y += blockPixelSize) {
        for (let x = 0; x < correctImgWidth; x += blockPixelSize) {
          let red = 0;
          let green = 0;
          let blue = 0;
          let alpha = 0;
          let numPixels = 0;

          for (let dy = 0; dy < blockPixelSize; dy++) {
            for (let dx = 0; dx < blockPixelSize; dx++) {
              if (x + dx < correctImgWidth && y + dy < correctImgHeight) {
                let offset = 4 * ((y + dy) * correctImgWidth + (x + dx));
                let redValue = imData[offset];
                let greenValue = imData[offset + 1];
                let blueValue = imData[offset + 2];
                let alphaValue = imData[offset + 3];

                if (alphaValue === 0) {
                  continue;
                }
                red += redValue;
                green += greenValue;
                blue += blueValue;
                alpha += alphaValue;
                numPixels++;
              }
            }
          }

          if (numPixels != 0) {
            red = Math.floor(red / numPixels);
            green = Math.floor(green / numPixels);
            blue = Math.floor(blue / numPixels);
            alpha = Math.floor(alpha / numPixels);
          } else {
            red = 0;
            green = 0;
            blue = 0;
            alpha = 0;
          }
          // Add color to array
          allColors.push([red, green, blue]);
        }
      }

      // Cluster colors using kmeans
      let kmeansResult = kmeans(allColors, 30);
      //let colorPalette = [];
      let i = 0;
      // Replace colors with cluster centroids

      for (let y = 0; y < correctImgHeight; y += blockPixelSize) {
        let newColor;
        for (let x = 0; x < correctImgWidth; x += blockPixelSize) {
          let color = allColors[i];
          let clusterFound = false;
          for (let cluster of kmeansResult.clusters) {
            for (let point of cluster.points) {
              if (point === color) {
                newColor = cluster.centroid;

                newColor[0] = Math.floor(newColor[0]);
                newColor[1] = Math.floor(newColor[1]);
                newColor[2] = Math.floor(newColor[2]);

                allColors[i] = newColor;

                clusterFound = true;
                break;
              }
            }
            if (clusterFound) {
              break;
            }
          }
          //Set color for the entire block
          ctx.clearRect(x, y, blockPixelSize, blockPixelSize);
          color =
            "rgb(" + newColor[0] + "," + newColor[1] + "," + newColor[2] + ")";
          ctx.fillStyle = color;
          ctx.fillRect(x, y, blockPixelSize, blockPixelSize);
          i++;
        }
      }

      //Display image and set download link
      resolve({
        imageURL: canvas.toDataURL(),
        allColors: allColors,
        xBlocks,
        yBlocks
      });
    };
    croppedImage.onerror = (error) => {
      reject(error);
    };
  });
}
