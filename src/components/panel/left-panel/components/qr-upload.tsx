import React from "react";
import { useState, useRef } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { ControllerRenderProps } from "react-hook-form";

const QrUpload = ({ field }: { field: ControllerRenderProps<any, any> }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      field.onChange(file);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div
        className={`relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"} cursor-pointer transition-colors`}
        onClick={handleUploadClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {image ? (
          <div className="relative h-full w-full">
            <Image
              src={image || "/placeholder.svg"}
              alt="Uploaded image"
              fill
              className="object-contain" // This ensures the entire image is visible
              sizes="(max-width: 768px) 100vw, 256px"
            />
          </div>
        ) : (
          <div className="p-4 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Click or drag image to upload
            </p>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default QrUpload;
