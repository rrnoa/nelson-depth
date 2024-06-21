export const escalarPulgadas = (alturas, rango, delta = 0.0254/4) => {
    const scala = [];
    for (let index = delta; index <= rango; index+=delta) {
        scala.push(index);
    }

    return scaleDepthValues(alturas, scala);

}

function scaleDepthValues(depthMap, targetRanges) {
    const scaledDepthMap = depthMap.map(value => {
      // Encontrar el rango más cercano al valor actual
      let closestRange = targetRanges[0];
      let minDiff = Math.abs(value - closestRange);
  
      for (let i = 1; i < targetRanges.length; i++) {
        const diff = Math.abs(value - targetRanges[i]);
        if (diff < minDiff) {
          closestRange = targetRanges[i];
          minDiff = diff;
        }
      }
  
      return closestRange;
    });

    return scaledDepthMap;
  }


  export function smoothHeightMap(heightMap, width, height, precision) {
    const smoothedHeightMap = [...heightMap]; // Copiar el mapa original para no modificarlo directamente
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const currentIdx = y * width + x;
        const currentHeight = heightMap[currentIdx];
  
        // Verificar vecinos
        const neighbors = [
          [x - 1, y], // Vecino izquierdo
          [x + 1, y], // Vecino derecho
          [x, y - 1], // Vecino superior
          [x, y + 1]  // Vecino inferior
        ];
  
        let sum = currentHeight;
        let count = 1;
  
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const neighborIdx = ny * width + nx;
            const neighborHeight = heightMap[neighborIdx];
  
            if (Math.abs(currentHeight - neighborHeight) > precision) {
              sum += neighborHeight;
              count++;
            }
          }
        }
  
        if (count > 1) {
          smoothedHeightMap[currentIdx] = sum / count;
        }
      }
    }
  
    return smoothedHeightMap;
  }
  
  