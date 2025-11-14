import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, Search, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

const VoiceCommerce = () => {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceResults, setVoiceResults] = useState<any>(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          processVoiceCommand(transcript.trim());
        }
      };
    } else {
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [transcript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const processVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    setError('');

    try {
      const response = await api.post('/voice/process-command', {
        command,
        userId: user?._id
      });

      setVoiceResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process voice command');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      // Use a female voice if available
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice =>
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('alex')
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      speechSynthesis.speak(utterance);
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await api.post('/cart/add', { productId, quantity: 1 });
      speakResponse('Product added to your cart successfully');
    } catch (err) {
      speakResponse('Sorry, I could not add that product to your cart');
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to use voice commerce</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Commerce
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            AI Powered
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Voice Input Section */}
        <div className="text-center space-y-4">
          <div className="relative">
            <Button
              onClick={isListening ? stopListening : startListening}
              size="lg"
              className={`w-20 h-20 rounded-full ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={isProcessing}
            >
              {isListening ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>

            {isListening && (
              <div className="absolute -inset-4 border-4 border-red-300 rounded-full animate-ping"></div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              {isListening ? 'Listening...' : 'Tap to speak'}
            </p>
            <p className="text-xs text-gray-500">
              Try: "Find red running shoes" or "Show me smartphones under 50k"
            </p>
          </div>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">You said:</p>
            <p className="text-sm text-gray-600 italic">"{transcript}"</p>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Processing your request...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Voice Results */}
        {voiceResults && (
          <div className="space-y-4">
            {/* AI Response */}
            {voiceResults.response && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">AI Assistant</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speakResponse(voiceResults.response)}
                    className="ml-auto h-6 w-6 p-0"
                  >
                    <Volume2 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-blue-800">{voiceResults.response}</p>
              </div>
            )}

            {/* Product Results */}
            {voiceResults.products && voiceResults.products.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Found Products</h4>
                {voiceResults.products.slice(0, 3).map((product: any) => (
                  <div key={product._id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <img
                      src={product.images?.[0] || '/placeholder.svg'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-sm text-green-600">KSh {product.price?.toLocaleString()}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product._id)}
                      className="flex-shrink-0"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {voiceResults.actions && voiceResults.actions.length > 0 && (
              <div className="flex gap-2">
                {voiceResults.actions.map((action: any, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (action.type === 'search') {
                        // Navigate to search results
                        window.location.href = `/products?keyword=${encodeURIComponent(action.query)}`;
                      }
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Voice Commands Help */}
        <div className="pt-4 border-t">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
              Voice Commands Examples
            </summary>
            <ul className="text-xs text-gray-600 space-y-1 ml-4">
              <li>• "Find blue jeans under 5000"</li>
              <li>• "Show me smartphones"</li>
              <li>• "Add running shoes to cart"</li>
              <li>• "What's the price of iPhone"</li>
              <li>• "Find products similar to this"</li>
            </ul>
          </details>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceCommerce;