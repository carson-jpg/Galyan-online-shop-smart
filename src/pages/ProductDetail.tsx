import { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProduct } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useProductReviews, useCreateReview, useUpdateReview, useDeleteReview, useMarkReviewHelpful, useReportReview } from "@/hooks/useReviews";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import ChatWidget from "@/components/ChatWidget";
import { Loader2, Star, ShoppingCart, Heart, Share2, ZoomIn, ZoomOut, RotateCcw, MessageSquarePlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: product, isLoading, error } = useProduct(id!);
  const addToCartMutation = useAddToCart();

  // Reviews state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [reviewsPage, setReviewsPage] = useState(1);

  const { data: reviewsData, isLoading: reviewsLoading } = useProductReviews(id!, reviewsPage);
  const createReviewMutation = useCreateReview();
  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();
  const markHelpfulMutation = useMarkReviewHelpful();
  const reportReviewMutation = useReportReview();

  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <Link to="/products">
              <Button>Back to Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    // Check if attributes are required and selected
    if (product.attributes && product.attributes.length > 0) {
      for (const attr of product.attributes) {
        if (!selectedAttributes[attr.name]) {
          toast({
            title: `Please select a ${attr.name}`,
            description: `You must select a ${attr.name} before adding to cart`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // If there's an active flash sale, use flash sale purchase instead
    if (isFlashSaleActive && !isFlashSaleSoldOut) {
      // Use flash sale purchase API
      // For now, we'll still use regular cart but could be enhanced to use flash sale API
      addToCartMutation.mutate(
        {
          productId: product._id,
          quantity: 1,
          attributes: selectedAttributes
        },
        {
          onSuccess: () => {
            toast({
              title: "Flash Sale Purchase!",
              description: `🎉 ${product.name} flash sale item added to your cart at KSh ${product.flashSale.flashPrice.toLocaleString()}!`,
            });
          },
          onError: (error: any) => {
            toast({
              title: "Error",
              description: error.response?.data?.message || "Failed to add to cart",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      addToCartMutation.mutate(
        {
          productId: product._id,
          quantity: 1,
          attributes: selectedAttributes
        },
        {
          onSuccess: () => {
            toast({
              title: "Added to cart",
              description: `${product.name} has been added to your cart`,
            });
          },
          onError: (error: any) => {
            toast({
              title: "Error",
              description: error.response?.data?.message || "Failed to add to cart",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const flashSaleDiscount = product.flashSale
    ? Math.round(((product.price - product.flashSale.flashPrice) / product.price) * 100)
    : 0;

  const isFlashSaleActive = product.flashSale &&
    product.flashSale.status === 'active' &&
    new Date(product.flashSale.endTime) > new Date();

  const isFlashSaleSoldOut = product.flashSale &&
    product.flashSale.soldQuantity >= product.flashSale.quantity;

  const handleZoomToggle = () => {
    if (isZoomed) {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
      setIsZoomed(false);
    } else {
      setIsZoomed(true);
      setZoomLevel(2);
    }
  };

  const handleZoomIn = () => {
    if (zoomLevel < 4) {
      setZoomLevel(prev => prev + 0.5);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel(prev => prev - 0.5);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isZoomed && zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && isZoomed && zoomLevel > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPanPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsZoomed(false);
  };

  // Review handlers
  const handleCreateReview = async (reviewData: any) => {
    if (!id) return;
    await createReviewMutation.mutateAsync({ productId: id, reviewData });
    setShowReviewForm(false);
  };

  const handleUpdateReview = async (reviewData: any) => {
    if (!editingReview) return;
    await updateReviewMutation.mutateAsync({ reviewId: editingReview._id, reviewData });
    setEditingReview(null);
    setShowReviewForm(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      await deleteReviewMutation.mutateAsync(reviewId);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    await markHelpfulMutation.mutateAsync(reviewId);
  };

  const handleReportReview = async (reviewId: string) => {
    await reportReviewMutation.mutateAsync(reviewId);
    toast({
      title: "Review reported",
      description: "Thank you for helping us maintain quality reviews.",
    });
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleCancelReview = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };

  const handleLoadMoreReviews = () => {
    setReviewsPage(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Chat Widget - Temporarily disabled until seller data is properly populated */}
      {/* {product.seller && (
        <ChatWidget
          productId={product._id}
          productName={product.name}
          sellerName={product.seller.businessName}
          sellerAvatar={product.seller.storeLogo}
        />
      )} */}

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div
                ref={containerRef}
                className="relative aspect-square overflow-hidden rounded-lg border bg-muted/20"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: isZoomed && zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              >
                <img
                  ref={imageRef}
                  src={product.images?.[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                    transformOrigin: 'center center'
                  }}
                  draggable={false}
                />

                {/* Zoom Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleZoomToggle}
                    className="backdrop-blur-sm"
                  >
                    {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                  </Button>
                  {isZoomed && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 4}
                        className="backdrop-blur-sm"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 1}
                        className="backdrop-blur-sm"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={resetZoom}
                        className="backdrop-blur-sm"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Zoom Level Indicator */}
                {isZoomed && (
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                )}
              </div>

              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImage(index);
                        resetZoom(); // Reset zoom when switching images
                      }}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${
                        selectedImage === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {product.rating} ({product.numReviews} reviews)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    {isFlashSaleActive ? (
                      <>
                        <span className="text-3xl font-bold text-red-600">
                          KSh {product.flashSale.flashPrice.toLocaleString()}
                        </span>
                        <span className="text-lg text-muted-foreground line-through">
                          KSh {product.price.toLocaleString()}
                        </span>
                        <Badge className="bg-red-500 text-white">FLASH SALE</Badge>
                        <Badge variant="destructive">-{flashSaleDiscount}%</Badge>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-primary">
                          KSh {product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && (
                          <>
                            <span className="text-lg text-muted-foreground line-through">
                              KSh {product.originalPrice.toLocaleString()}
                            </span>
                            <Badge variant="destructive">-{discount}%</Badge>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {isFlashSaleActive ? (
                    <>
                      <Badge variant={isFlashSaleSoldOut ? "destructive" : "default"}>
                        {isFlashSaleSoldOut ? "FLASH SALE SOLD OUT" : "FLASH SALE ACTIVE"}
                      </Badge>
                      {!isFlashSaleSoldOut && (
                        <span className="text-sm text-muted-foreground">
                          {product.flashSale.quantity - product.flashSale.soldQuantity} of {product.flashSale.quantity} available
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                      {product.stock > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {product.stock} available
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Dynamic Attributes Selection */}
              {product.attributes && product.attributes.length > 0 && (
                <div className="space-y-6">
                  {product.attributes.map((attr) => (
                    <div key={attr.name} className="space-y-3">
                      <label className="font-semibold text-base">{attr.name}:</label>
                      <div className="grid grid-cols-2 gap-2">
                        {attr.values.map((value) => (
                          <button
                            key={value}
                            onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.name]: value }))}
                            className={`p-3 border rounded-lg text-left transition-colors ${
                              selectedAttributes[attr.name] === value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              {product.brand && (
                <div>
                  <span className="font-semibold">Brand: </span>
                  <span className="text-muted-foreground">{product.brand}</span>
                </div>
              )}

              <div>
                <span className="font-semibold">Category: </span>
                <Link
                  to={`/products?category=${product.category?.name?.toLowerCase() || ''}`}
                  className="text-primary hover:underline"
                >
                  {product.category?.name || 'Unknown Category'}
                </Link>
              </div>

              {product.tags && product.tags.length > 0 && (
                <div>
                  <span className="font-semibold">Tags: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={
                    (isFlashSaleActive ? isFlashSaleSoldOut : product.stock === 0) ||
                    addToCartMutation.isPending
                  }
                  className="flex-1"
                  size="lg"
                >
                  {addToCartMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  {isFlashSaleActive && !isFlashSaleSoldOut
                    ? `Buy Flash Sale - KSh ${product.flashSale.flashPrice.toLocaleString()}`
                    : isFlashSaleSoldOut
                    ? "Flash Sale Sold Out"
                    : "Add to Cart"
                  }
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>✓ Free delivery on orders over KSh 50,000</p>
                <p>✓ 30-day return policy</p>
                <p>✓ Secure payment with M-Pesa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 space-y-8">
          {/* Review Form */}
          {user && (
            <div className="flex justify-center">
              {!showReviewForm ? (
                <Button
                  onClick={() => setShowReviewForm(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  Write a Review
                </Button>
              ) : (
                <div className="w-full max-w-2xl">
                  <ReviewForm
                    productId={id!}
                    onSubmit={editingReview ? handleUpdateReview : handleCreateReview}
                    onCancel={handleCancelReview}
                    initialData={editingReview ? {
                      rating: editingReview.rating,
                      title: editingReview.title,
                      comment: editingReview.comment,
                    } : undefined}
                    isEditing={!!editingReview}
                  />
                </div>
              )}
            </div>
          )}

          {/* Reviews List */}
          <ReviewList
            reviews={reviewsData?.reviews || []}
            isLoading={reviewsLoading}
            hasMore={reviewsData ? reviewsData.page < reviewsData.pages : false}
            onLoadMore={handleLoadMoreReviews}
            onMarkHelpful={handleMarkHelpful}
            onReport={handleReportReview}
            onEdit={handleEditReview}
            onDelete={handleDeleteReview}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
