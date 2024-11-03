import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

function ImageUploader({ onImageUpload, maxImages = 3 }) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    if (images.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('http://localhost:3001/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const newImage = {
          url: response.data.url,
          name: file.name
        };

        setImages(prev => [...prev, newImage]);
        onImageUpload(newImage);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          multiple
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading || images.length >= maxImages}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Add Images'}
        </button>
        <span className="text-sm text-gray-500">
          {images.length}/{maxImages} images
        </span>
      </div>

      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img 
              src={image.url} 
              alt={image.name}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

ImageUploader.propTypes = {
  onImageUpload: PropTypes.func.isRequired,
  maxImages: PropTypes.number
};

export default ImageUploader;