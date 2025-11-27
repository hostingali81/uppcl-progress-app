import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file to be under a specified size (default 4.5MB).
 * @param file The file to compress
 * @param maxSizeMB The maximum size in MB (default 4.5)
 * @param maxWidthOrHeight The maximum width or height (default 1920)
 * @returns A promise that resolves to the compressed File object
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 2,
  maxWidthOrHeight: number = 1920
): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: file.type as string,
  };

  try {
    console.log(`Attempting to compress ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed ${file.name} to ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

    // Create a new File object from the Blob to ensure it has the correct name and lastModified
    return new File([compressedFile], file.name, {
      type: file.type,
      lastModified: new Date().getTime(),
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    // If compression fails, return the original file
    return file;
  }
}
