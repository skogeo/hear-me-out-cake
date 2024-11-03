import { Loader2 } from 'lucide-react';

export const JoinForm = ({
  mode,
  username,
  sessionId,
  error,
  isLoading,
  onUsernameChange,
  onSessionIdChange,
  onBack,
  onSubmit
}) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-center mb-6">
      {mode === 'create' ? 'Create Session' : 'Join Session'}
    </h2>
    
    <input
      type="text"
      placeholder="Your name"
      value={username}
      onChange={onUsernameChange}
      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    {mode === 'join' && (
      <input
        type="text"
        placeholder="Session ID"
        value={sessionId}
        onChange={onSessionIdChange}
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )}

    {error && (
      <div className="p-2 text-sm text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    )}

    <div className="flex gap-2">
      <button
        onClick={onBack}
        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
      >
        Back
      </button>
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Loading...' : mode === 'create' ? 'Create' : 'Join'}
      </button>
    </div>
  </div>
);