/**
 * Validates if an image meets the minimum dimension requirements
 * @param file The file to validate
 * @param minWidth Minimum required width in pixels
 * @param minHeight Minimum required height in pixels
 * @returns Promise resolving to a boolean indicating if the image is valid
 */
export function validateImageDimensions(
  file: File,
  minWidth = 300,
  minHeight = 300,
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img.width >= minWidth && img.height >= minHeight);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(false);
    };
  });
}

/**
 * Checks if a file is a valid image type
 * @param file The file to check
 * @returns Boolean indicating if the file is a valid image type
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/jpg"];
  return validTypes.includes(file.type);
}

/**
 * Checks if an image file size is within the specified limit
 * @param file The file to check
 * @param maxSizeInMB Maximum size in megabytes
 * @returns Boolean indicating if the file size is within limits
 */
export function isValidImageSize(file: File, maxSizeInMB = 10): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}
