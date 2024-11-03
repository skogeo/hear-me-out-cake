export const InitialView = ({ onCreateClick, onJoinClick }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-center mb-6">Choose an option</h2>
    <button
      onClick={onCreateClick}
      className="w-full bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
    >
      Create New Session
    </button>
    <button
      onClick={onJoinClick}
      className="w-full bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600"
    >
      Join Existing Session
    </button>
  </div>
);