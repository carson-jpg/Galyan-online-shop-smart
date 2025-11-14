import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, X } from 'lucide-react';
import { useSmartSearch } from '@/hooks/useSmartSearch';
import { useNavigate } from 'react-router-dom';

interface SmartSearchBarProps {
  placeholder?: string;
  className?: string;
}

const SmartSearchBar = ({ placeholder = "Search for products...", className = "" }: SmartSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const { data: searchResults, isLoading } = useSmartSearch(query, {});

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  // AI-powered search suggestions based on query analysis
  const getAISuggestions = () => {
    if (!searchResults?.analysis) return [];

    const suggestions = [];
    const { keywords, category, intent } = searchResults.analysis;

    if (category) {
      suggestions.push(`Browse ${category} products`);
    }

    if (intent === 'search' && keywords?.length > 0) {
      suggestions.push(`Find ${keywords[0]} deals`);
      suggestions.push(`Show ${keywords[0]} reviews`);
    }

    return suggestions.slice(0, 3);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="pr-12"
        />
        <Button
          onClick={() => handleSearch(query)}
          size="sm"
          className="absolute right-1 top-1 h-8 w-8 p-0"
          disabled={!query.trim()}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* AI Search Suggestions */}
      {showSuggestions && query.length > 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* AI Analysis */}
          {searchResults?.analysis && (
            <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">AI Search Analysis</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {searchResults.analysis.keywords?.map((keyword: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {searchResults.analysis.category && (
                  <Badge variant="outline" className="text-xs">
                    Category: {searchResults.analysis.category}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Search Results Preview */}
          {searchResults?.products && searchResults.products.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Found {searchResults.total} products
              </div>
              <div className="space-y-2">
                {searchResults.products.slice(0, 3).map((product: any) => (
                  <div
                    key={product._id}
                    onClick={() => navigate(`/products/${product._id}`)}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <img
                      src={product.images?.[0] || '/placeholder.svg'}
                      alt={product.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{product.name}</div>
                      <div className="text-sm text-green-600">KSh {product.price?.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {getAISuggestions().length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-700 mb-2">Smart Suggestions</div>
              <div className="space-y-1">
                {getAISuggestions().map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Analyzing your search...</p>
            </div>
          )}

          {/* No Results */}
          {!isLoading && query.length > 2 && (!searchResults?.products || searchResults.products.length === 0) && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No products found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try different keywords or check spelling</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;