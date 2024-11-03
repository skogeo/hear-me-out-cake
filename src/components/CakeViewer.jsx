import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

function CakeViewer({ participants, onFinish }) {
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    console.log('CakeViewer participants:', participants);
  }, [participants]);

  // Функция для расчета позиции каждого изображения
  const calculatePosition = (index, total) => {
    if (total === 1) {
      return { left: '50%', top: '50%' };
    }

    const angle = (2 * Math.PI * index) / total;
    const radius = 35; // Процент от размера торта
    
    return {
      left: `${50 + radius * Math.cos(angle)}%`,
      top: `${50 + radius * Math.sin(angle)}%`
    };
  };

  const allImages = participants.flatMap(participant => {
    console.log('Processing participant:', participant);
    return participant.images.map(image => ({
      ...image,
      username: participant.username
    }));
  });

  console.log('All processed images:', allImages);

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-3xl font-semibold text-center">
            Our Hear Me Out Cake
          </h2>
          <p className="text-center text-gray-500 text-lg mt-2">
            {participants.length} participants shared their crushes
          </p>
        </div>

        <div className="relative w-full p-8">
          {/* Круглый торт */}
          <div className="relative aspect-square max-w-3xl mx-auto">
            {/* Основной круг торта */}
            <div className="absolute inset-0 bg-pink-200 rounded-full border-8 border-pink-300 shadow-lg">
              {/* Декоративная окантовка */}
              <div className="absolute inset-2 rounded-full border-4 border-pink-100 opacity-50" />
              
              {/* Изображения на торте */}
              {allImages.map((image, index) => {
                const position = calculatePosition(index, allImages.length);
                return (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-110 z-10"
                    style={position}
                  >
                    <div className="relative group">
                      {/* Изображение */}
                      <img
                        src={`http://localhost:3001${image.url}`}
                        alt={`${image.username}'s crush`}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                        onError={(e) => {
                          console.error('Image load error:', e);
                          e.target.src = 'https://via.placeholder.com/150';
                        }}
                      />
                      
                      {/* Имя пользователя */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md text-sm whitespace-nowrap">
                        {image.username}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Кнопка завершения */}
        <div className="p-6 border-t flex justify-center gap-4">
          <button
            onClick={onFinish}
            className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center gap-2 text-lg"
          >
            <Heart className="w-6 h-6" />
            Finish
          </button>
        </div>
      </div>

      {/* Модальное окно для просмотра изображения */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-8"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative bg-white rounded-lg p-6 max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={`http://localhost:3001${selectedImage.url}`}
              alt={`${selectedImage.username}'s crush`}
              className="w-full h-auto rounded-lg"
            />
            <p className="mt-6 text-center text-2xl font-medium">
              {selectedImage.username}'s crush
            </p>
            <button
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg text-gray-500 hover:text-gray-700 text-xl"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CakeViewer;