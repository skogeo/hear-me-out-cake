import { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import heic2any from 'heic2any';

const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic', '.heif'],
  'image/heif': ['.heif'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff', '.tif']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function ImageUploader({ onImageUpload, maxImages = 20, existingImages = [] }) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(existingImages);
  const [error, setError] = useState('');
  const [currentImage, setCurrentImage] = useState(null);
  const [characterName, setCharacterName] = useState('');
  const fileInputRef = useRef();

  const validateFile = (file) => {
    if (!file) return 'No file selected';
    if (!Object.keys(ALLOWED_TYPES).includes(file.type)) 
      return 'Invalid file type. Supported formats: JPG, PNG, GIF, WebP, HEIC/HEIF, BMP, TIFF';
    if (file.size > MAX_FILE_SIZE) 
      return 'File size exceeds 10MB limit';
    return null;
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (images.length >= maxImages) {
      setError(`You can only upload up to ${maxImages} images`);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Convert HEIC/HEIF to JPEG if needed
    let processedFile = file;
    if (file.type.includes('heic') || file.type.includes('heif')) {
      try {
        const blob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });
        processedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { 
          type: 'image/jpeg' 
        });
      } catch (error) {
        setError('Failed to convert HEIC/HEIF image');
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCurrentImage({
        file: processedFile,
        preview: reader.result
      });
    };
    reader.readAsDataURL(processedFile);

    event.target.value = '';
  };

  const handleUpload = async () => {
    if (!currentImage || !characterName.trim()) {
      setError('Please enter character name');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', currentImage.file);

      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const newImage = {
        url: response.data.url,
        characterName: characterName.trim(),
        preview: currentImage.preview
      };

      setImages(prev => [...prev, newImage]);
      onImageUpload(newImage);

      setCurrentImage(null);
      setCharacterName('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={!currentImage ? "flex items-center gap-4" : "hidden"}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={Object.entries(ALLOWED_TYPES)
            .map(([type, exts]) => `${type},${exts.join(',')}`)
            .join(',')}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
          capture="environment"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading || images.length >= maxImages}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            images.length >= maxImages
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <ImagePlus className="w-5 h-5" />
          Add Image
        </button>
        <span className="text-sm text-gray-500">
          {images.length}/{maxImages} images
        </span>
      </div>

           {/* Preview and character name input */}
           {currentImage && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex gap-4 items-start">
            <div className="relative group">
              <img 
                src={currentImage.preview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Character Name
                </label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Enter character name"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  disabled={uploading || !characterName.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload
                    </>
                  )}
                </button>
                <button
                  onClick={cancelUpload}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Uploaded images grid */}
      <div className="grid grid-cols-3 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img 
              src={image.preview || `${import.meta.env.VITE_API_BASE_URL}${image.url}`}
              alt={image.characterName}
              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg">
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <p className="text-white text-center font-medium px-2">
                  {image.characterName}
                </p>
                <button
                  onClick={() => removeImage(index)}
                  className="mt-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageUploader;