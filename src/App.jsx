import SessionManager from './components/session/SessionManager';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-[1400px]"> {/* Увеличили максимальную ширину */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            Hear Me Out Cake 🎂
          </h1>
          <SessionManager />
        </div>
      </div>
    </div>
  );
}

export default App;