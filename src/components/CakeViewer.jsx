import { useState, useEffect } from 'react';
import { Heart, X, ChevronRight } from 'lucide-react';

function CakeViewer({ participants, sessionId, currentRevealIndex, onRevealNext, onFinish }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [revealedImages, setRevealedImages] = useState([]);
  const [currentParticipantName, setCurrentParticipantName] = useState('');

  useEffect(() => {
    console.log('CakeViewer participants:', participants);
    console.log('Current reveal index:', currentRevealIndex);
  }, [participants, currentRevealIndex]);

  // Обновляем список раскрытых изображений при изменении индекса
  useEffect(() => {
    const revealed = [];
    for (let i = 0; i <= currentRevealIndex; i++) {
      if (participants[i]) {
        revealed.push(...participants[i].images);
        if (i === currentRevealIndex) {
          setCurrentParticipantName(participants[i].username);
        }
      }
    }
    setRevealedImages(revealed);
  }, [currentRevealIndex, participants]);

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

  const allImages = participants.flatMap(participant => 
    participant.images.map(image => ({
      ...image,
      username: participant.username
    }))
  );

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-3xl font-semibold text-center">
            Our Hear Me Out Cake
          </h2>
          <p className="text-center text-gray-500 text-lg mt-2">
            {revealedImages.length} of {allImages.length} crushes revealed
          </p>
          {currentParticipantName && (
            <p className="text-center text-pink-500 font-medium mt-2">
              Now revealing: {currentParticipantName}'s crushes
            </p>
          )}
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
                const isRevealed = revealedImages.some(
                  revealedImg => revealedImg.url === image.url
                );
                
                if (!isRevealed) return null;

                const position = calculatePosition(index, allImages.length);
                return (
                  <div
                    key={index}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 hover:scale-110 z-10"
                    style={position}
                  >
                    <div className="relative group">
                      {/* Изображение */}
                      <img 
                        src={image.preview || `${import.meta.env.VITE_API_BASE_URL}${image.url}`}
                        alt={image.characterName}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      
                      {/* Информация при наведении */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-md text-center whitespace-nowrap">
                        <div className="font-medium text-gray-900">{image.characterName}</div>
                        <div className="text-sm text-gray-500">by {image.username}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="p-6 border-t flex justify-center gap-4">
          {currentRevealIndex < participants.length - 1 ? (
            <button
              onClick={onRevealNext}
              className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center gap-2 text-lg transition-colors"
            >
              Reveal Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onFinish}
              className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 text-lg"
            >
              <Heart className="w-6 h-6" />
              Finish
            </button>
          )}
        </div>
      </div>

      {/* Модальное окно */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-8"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black to-transparent z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  {selectedImage.username}'s Crush
                </h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="w-full md:w-2/3 relative">
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}${selectedImage.url}`}
                  alt={`${selectedImage.username}'s crush`}
                  className="w-full h-[500px] object-cover"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    e.target.src = 'https://via.placeholder.com/500';
                  }}
                />
              </div>

              {/* Info panel */}
              <div className="w-full md:w-1/3 bg-white p-6 flex flex-col">
                <div className="space-y-6">
                  {/* Character info */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Character
                    </h4>
                    <p className="text-2xl font-bold text-pink-600 mt-1">
                      {selectedImage.characterName}
                    </p>
                  </div>

                  {/* Shared by */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Shared by
                    </h4>
                    <p className="text-gray-600 mt-1">
                      {selectedImage.username}
                    </p>
                  </div>

                  {/* Divider */}
                  <hr className="border-gray-200" />

                  {/* Session info */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Session Details
                    </h4>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Total participants: {participants.length}</p>
                      <p>Revealed crushes: {revealedImages.length} of {allImages.length}</p>
                    </div>
                  </div>
                </div>

                {/* Close button at bottom */}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="mt-auto w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CakeViewer;