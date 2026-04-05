/**
 * Converts a blob, file, or local image URL to a Data URI (base64)
 * This allows local images to be stored and displayed across sessions
 * Automatically compresses the image to reduce payload size
 */
export async function convertImageToDataUri(
  imageUri: string,
  quality: number = 0.7
): Promise<string> {
  // If already a data URI, compress it
  if (imageUri.startsWith("data:")) {
    return compressImageDataUri(imageUri, quality);
  }

  // If it's an HTTP/HTTPS URL, return as-is (already accessible)
  if (imageUri.startsWith("http://") || imageUri.startsWith("https://")) {
    return imageUri;
  }

  // For blob:// and file:// URLs, fetch and convert to data URI
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        // Compress the converted image
        void compressImageDataUri(dataUri, quality).then(resolve).catch(reject);
      };
      reader.onerror = () => {
        reject(new Error("Failed to convert image to data URI"));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to data URI:", error);
    throw new Error(
      "Nao foi possivel processar a imagem. Tente usar uma URL publica (https://...) ou selecione outra imagem."
    );
  }
}

/**
 * Converts all local images in an array to data URIs
 */
export async function convertLocalImagesToDataUris(
  imageUris: string[],
  quality: number = 0.7
): Promise<string[]> {
  const promises = imageUris.map(async (uri) => {
    try {
      return await convertImageToDataUri(uri, quality);
    } catch {
      // If conversion fails, return original URI
      // Backend validation will catch if it's invalid
      return uri;
    }
  });

  return Promise.all(promises);
}

/**
 * Check if an image URI is local (not HTTP/HTTPS)
 */
export function isLocalImageUri(imageUri: string): boolean {
  const normalized = imageUri.trim().toLowerCase();
  return (
    normalized.startsWith("blob:") ||
    normalized.startsWith("file://") ||
    (normalized.startsWith("data:") && !normalized.startsWith("data:image/"))
  );
}

/**
 * Compress an image data URI to reduce payload size
 * Useful for large local images
 */
export async function compressImageDataUri(
  dataUri: string,
  quality: number = 0.7
): Promise<string> {
  // If not a data URI, return as-is
  if (!dataUri.startsWith("data:")) {
    return dataUri;
  }

  // If it's an HTTP/HTTPS URL, return as-is
  if (dataUri.startsWith("http://") || dataUri.startsWith("https://")) {
    return dataUri;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve(dataUri);
            return;
          }

          // Set canvas size to image size (with max dimensions to prevent memory issues)
          const maxDimension = 1920;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          try {
            const compressed = canvas.toDataURL("image/jpeg", quality);
            // Only use compressed if it's actually smaller
            if (compressed.length < dataUri.length) {
              resolve(compressed);
            } else {
              resolve(dataUri);
            }
          } catch {
            resolve(dataUri);
          }
        } catch {
          resolve(dataUri);
        }
      };

      img.onerror = () => {
        resolve(dataUri);
      };

      img.src = dataUri;
    } catch {
      resolve(dataUri);
    }
  });
}
