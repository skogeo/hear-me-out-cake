import ImageUploader from '../ImageUploader';

export const ActiveSession = ({
  username,
  sessionId,
  participants,
  images,
  isReady,
  readyCount,
  canStart,
  error,
  onImageUpload,
  onToggleReady,
  onStart,
  onLogout
}) => (
  <div className="space-y-6">
    {/* User info panel with logout */}
    <div className="bg-blue-50 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">Your Profile:</h3>
          <p className="text-blue-700">{username}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-blue-600">
            {isReady ? 'Ready to share' : 'Not ready yet'}
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>

    {/* Session ID */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-semibold mb-1">Session ID:</h3>
      <div className="flex items-center gap-2">
        <code className="bg-white px-2 py-1 rounded border flex-1">
          {sessionId}
        </code>
        <button
          onClick={() => navigator.clipboard.writeText(sessionId)}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Copy
        </button>
      </div>
    </div>

    {/* Upload section */}
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Your Crushes</h3>
        <span className="text-sm text-gray-500">
          {images.length} of 3 images uploaded
        </span>
      </div>
      <ImageUploader 
        onImageUpload={onImageUpload}
        maxImages={20}
        existingImages={images}
      />
    </div>

    {/* Participants list */}
    <div className="border-t pt-4">
      <h3 className="font-semibold mb-3">
        Participants ({participants.length})
      </h3>
      <div className="space-y-2">
        {participants.map((participant, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg ${
              participant.username === username 
                ? 'border-2 border-blue-300 bg-blue-50' 
                : participant.ready 
                  ? 'bg-green-50' 
                  : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{participant.username}</span>
              {participant.username === username && (
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                  You
                </span>
              )}
              {participant.images.length > 0 && (
                <span className="text-xs text-gray-500">
                  ({participant.images.length} images)
                </span>
              )}
            </div>
            <span
              className={`text-sm ${
                participant.ready ? 'text-green-600' : 'text-gray-500'
              }`}
            >
              {participant.ready ? '✓ Ready' : 'Not Ready'}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* Ready status and controls */}
    <div className="border-t pt-4">
      <div className="text-center text-sm text-gray-600 mb-3">
        {readyCount} of {participants.length} participants ready
      </div>
      <button
        onClick={onToggleReady}
        disabled={images.length === 0}
        className={`w-full py-2 rounded-lg transition-colors ${
          isReady 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-green-500 hover:bg-green-600'
        } text-white disabled:bg-gray-300`}
      >
        {isReady ? 'Cancel Ready' : 'Mark as Ready'}
      </button>
    </div>

    {/* Start button */}
    {canStart && (
      <div className="border-t pt-4">
        <button
          onClick={onStart}
          className="w-full py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Start Viewing
        </button>
      </div>
    )}

    {/* Error display */}
    {error && (
      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    )}
  </div>
);