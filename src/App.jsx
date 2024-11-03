import SessionManager from './components/SessionManager';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">
            Hear Me Out Cake 🎂
          </h1>
          <SessionManager />
        </div>
      </div>
    </div>
  );
}

export default App;