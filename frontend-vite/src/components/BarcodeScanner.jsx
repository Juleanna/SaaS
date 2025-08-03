import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CameraIcon, StopIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ 
  isOpen, 
  onClose, 
  onScan,
  title = 'Сканування штрих-коду',
  placeholder = 'Наведіть камеру на штрих-код або введіть код вручну'
}) => {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Завантажуємо бібліотеку для розпізнавання штрих-кодів (імітація)
  const scanBarcodeFromCanvas = (canvas) => {
    // В реальному проекті тут буде використана бібліотека типу QuaggaJS або ZXing
    // Зараз імітуємо процес сканування
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Імітація результату сканування (в реальності тут буде алгоритм розпізнавання)
    // Повертаємо null, якщо код не знайдено
    return null;
  };

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Задня камера на мобільних пристроях
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsScanning(true);
      
      // Запускаємо періодичне сканування
      intervalRef.current = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const result = scanBarcodeFromCanvas(canvas);
          if (result) {
            handleScanResult(result);
          }
        }
      }, 500); // Сканування кожні 500мс
      
    } catch (err) {
      console.error('Camera error:', err);
      let errorMessage = 'Помилка доступу до камери';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Доступ до камери заборонено. Перевірте дозволи браузера.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Камера не знайдена.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Камера не підтримується цим браузером.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = (code) => {
    if (code && !scanHistory.includes(code)) {
      setScanHistory(prev => [code, ...prev.slice(0, 4)]); // Зберігаємо останні 5 кодів
      onScan(code);
      toast.success(`Код відсканований: ${code}`);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanResult(manualCode.trim());
      setManualCode('');
    }
  };

  const handleClose = () => {
    stopCamera();
    setManualCode('');
    setScanHistory([]);
    setError('');
    onClose();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Автофокус на полі вводу коли модальне вікно відкривається
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const input = document.getElementById('manual-code-input');
        if (input) {
          input.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Camera Section */}
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                {!isScanning ? (
                  <div className="space-y-4">
                    <CameraIcon className="h-16 w-16 text-gray-400 mx-auto" />
                    <p className="text-gray-600">{placeholder}</p>
                    <button
                      onClick={startCamera}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <CameraIcon className="h-5 w-5 mr-2" />
                      Запустити камеру
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        className="w-full h-64 object-cover rounded-lg bg-black"
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-red-500 rounded-lg">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={stopCamera}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <StopIcon className="h-5 w-5 mr-2" />
                      Зупинити камеру
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Manual Input */}
              <div className="border-t border-gray-200 pt-4">
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="manual-code-input" className="block text-sm font-medium text-gray-700 mb-2">
                      Або введіть код вручну:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        id="manual-code-input"
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Введіть штрих-код або QR код"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!manualCode.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Сканувати
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Scan History */}
              {scanHistory.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Останні відскановані коди:</h4>
                  <div className="space-y-2">
                    {scanHistory.map((code, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm font-mono text-gray-900">{code}</span>
                        <button
                          onClick={() => onScan(code)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Використати знову
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Інструкції:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Наведіть камеру на штрих-код або QR код</li>
                  <li>• Переконайтесь, що код знаходиться в червоній рамці</li>
                  <li>• Код буде автоматично розпізнаний</li>
                  <li>• Також можна ввести код вручну в поле нижче</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Закрити
              </button>
            </div>
          </div>

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;