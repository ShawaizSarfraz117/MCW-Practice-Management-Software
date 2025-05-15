"use client";

import { useState, useRef, useEffect } from "react";
import { X, Minus, Plus } from "lucide-react";

interface ImageCropperProps {
  imageUrl: string;
  onCancel: () => void;
  onApply: (croppedFile: File) => void;
  fileName: string;
  fileType: string;
}

const ImageCropper = ({
  imageUrl,
  onCancel,
  onApply,
  fileName,
  fileType,
}: ImageCropperProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);

  // Handle dragging for repositioning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;
    e.preventDefault();

    // Calculate new position
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Calculate the size of the scaled image
    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;

    // Calculate boundaries to ensure image always fills the crop area
    const maxX = (scaledWidth - 400) / 2;
    const minX = -maxX;
    const maxY = (scaledHeight - 300) / 2;
    const minY = -maxY;

    // Apply constraints
    const constrainedX = Math.min(Math.max(newX, minX), maxX);
    const constrainedY = Math.min(Math.max(newY, minY), maxY);

    setPosition({
      x: constrainedX,
      y: constrainedY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add mouse event listeners for drag outside the crop area
  useEffect(() => {
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Handler for global mouse move to continue dragging outside the element
  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    // Calculate new position
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Calculate the size of the scaled image
    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;

    // Calculate boundaries to ensure image always fills the crop area
    const maxX = (scaledWidth - 400) / 2;
    const minX = -maxX;
    const maxY = (scaledHeight - 300) / 2;
    const minY = -maxY;

    // Apply constraints
    const constrainedX = Math.min(Math.max(newX, minX), maxX);
    const constrainedY = Math.min(Math.max(newY, minY), maxY);

    setPosition({
      x: constrainedX,
      y: constrainedY,
    });
  };

  // Handle scaling with slider
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseFloat(e.target.value);

    // When zooming, adjust the position to keep the center point consistent
    if (imageRef.current && imageDimensions.width > 0) {
      const oldScaledWidth = imageDimensions.width * scale;
      const oldScaledHeight = imageDimensions.height * scale;
      const newScaledWidth = imageDimensions.width * newScale;
      const newScaledHeight = imageDimensions.height * newScale;

      // Calculate position adjustment to maintain center focus
      const ratioX = position.x / (oldScaledWidth - 400);
      const ratioY = position.y / (oldScaledHeight - 300);

      // Only adjust position if there is room to move (image larger than crop frame)
      const newX = newScaledWidth > 400 ? ratioX * (newScaledWidth - 400) : 0;
      const newY = newScaledHeight > 300 ? ratioY * (newScaledHeight - 300) : 0;

      setPosition({
        x: newX || 0,
        y: newY || 0,
      });
    }

    setScale(newScale);
  };

  // Handle zoom in/out buttons
  const handleZoomIn = () => {
    if (imageRef.current && imageDimensions.width > 0) {
      const minScale = Math.max(
        400 / imageDimensions.width,
        300 / imageDimensions.height,
      );
      const maxScale = minScale * 1.5;
      // Increase zoom by 0.1, but don't exceed max scale
      const newScale = Math.min(scale + 0.1, maxScale);
      handleScaleChange({
        target: { value: newScale.toString() },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleZoomOut = () => {
    if (imageRef.current && imageDimensions.width > 0) {
      const minScale = Math.max(
        400 / imageDimensions.width,
        300 / imageDimensions.height,
      );
      // Decrease zoom by 0.1, but don't go below min scale
      const newScale = Math.max(scale - 0.1, minScale);
      handleScaleChange({
        target: { value: newScale.toString() },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // Handle image load to get dimensions
  const handleImageLoad = () => {
    if (imageRef.current) {
      const imgWidth = imageRef.current.naturalWidth;
      const imgHeight = imageRef.current.naturalHeight;

      setImageDimensions({
        width: imgWidth,
        height: imgHeight,
      });

      // Calculate appropriate initial scale based on image size and crop frame
      const frameWidth = 400;
      const frameHeight = 300;
      const widthRatio = frameWidth / imgWidth;
      const heightRatio = frameHeight / imgHeight;

      // Use the larger ratio to ensure the image fills the frame
      // This is the minimum scale that ensures the crop area is completely filled
      const minScale = Math.max(widthRatio, heightRatio);
      const initialScale = minScale;

      // Calculate max scale - limited to 1.5x the minimum
      const maxScale = minScale * 1.5;

      // Set the scale and also update the slider's min attribute
      setScale(initialScale);
      setPosition({ x: 0, y: 0 }); // Reset position when image loads

      // Update the slider's min and max attributes
      const sliderElement = document.getElementById(
        "zoom-slider",
      ) as HTMLInputElement;
      if (sliderElement) {
        sliderElement.min = minScale.toString();
        sliderElement.max = maxScale.toString();
      }
    }
  };

  // Apply changes with center frame crop
  const handleApply = () => {
    if (!canvasRef.current || !imageRef.current) return;

    // Get image dimensions
    const imgWidth = imageDimensions.width;
    const imgHeight = imageDimensions.height;

    // Define the crop frame dimensions (4:3 aspect ratio)
    const frameWidth = 400;
    const frameHeight = 300;

    // Calculate source coordinates based on position and scale
    const sourceX = imgWidth / 2 - position.x / scale - frameWidth / scale / 2;
    const sourceY =
      imgHeight / 2 - position.y / scale - frameHeight / scale / 2;
    const sourceWidth = frameWidth / scale;
    const sourceHeight = frameHeight / scale;

    // Setup canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match the frame dimensions
    canvas.width = frameWidth;
    canvas.height = frameHeight;

    // Draw the image
    ctx.drawImage(
      imageRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a new file from the blob
        const croppedFile = new File([blob], fileName, {
          type: fileType,
        });

        // Call the onApply callback with the cropped file
        onApply(croppedFile);
      }
    }, fileType);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium text-gray-900">Edit image</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Image preview area */}
        <div className="relative w-full h-[400px] mb-6 bg-gray-100 overflow-hidden rounded-md">
          {/* Main image with zoom */}
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Edit preview"
              className="w-auto h-auto max-w-none"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: "center",
                cursor: isDragging ? "grabbing" : "grab",
              }}
              onLoad={handleImageLoad}
              draggable="false"
            />
          </div>

          {/* Crop overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              ref={cropAreaRef}
              className="w-[400px] h-[300px] border-2 border-blue-500 box-content shadow-sm relative"
            >
              {/* Transparent center area */}
            </div>
            {/* Semi-transparent overlay for areas outside crop frame */}
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              style={{
                mask: "linear-gradient(#000 0 0) center/400px 300px no-repeat",
                WebkitMask:
                  "linear-gradient(#000 0 0) center/400px 300px no-repeat",
                maskComposite: "exclude",
                WebkitMaskComposite: "xor",
              }}
            ></div>
          </div>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 mb-6 px-4">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4 text-gray-500" />
          </button>
          <div className="flex-1 relative h-1 bg-gray-200 rounded-full">
            <div
              className="absolute top-0 left-0 h-1 bg-blue-500 rounded-full"
              style={{
                width:
                  imageRef.current && imageDimensions.width > 0
                    ? `${
                        ((scale -
                          Math.max(
                            400 / imageDimensions.width,
                            300 / imageDimensions.height,
                          )) /
                          (Math.max(
                            400 / imageDimensions.width,
                            300 / imageDimensions.height,
                          ) *
                            1.5 -
                            Math.max(
                              400 / imageDimensions.width,
                              300 / imageDimensions.height,
                            ))) *
                        100
                      }%`
                    : "0%",
              }}
            ></div>
            <input
              id="zoom-slider"
              type="range"
              min="0.2"
              max="3"
              step="0.05"
              value={scale}
              onChange={handleScaleChange}
              className="absolute top-1/2 -translate-y-1/2 w-full h-5 opacity-0 cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V16M8 12H16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 3.5H9C6.5 3.5 4.5 5.5 4.5 8V16C4.5 18.5 6.5 20.5 9 20.5H15C17.5 20.5 19.5 18.5 19.5 16V8C19.5 5.5 17.5 3.5 15 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Drag to reposition
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Hidden canvas for processing the cropped image */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default ImageCropper;
