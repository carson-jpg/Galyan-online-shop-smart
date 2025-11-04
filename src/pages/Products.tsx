import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

// Mock data - Complete product catalog
const products = [
  // Electronics
  {
    id: "1",
    name: "Samsung Galaxy A54 5G Smartphone",
    price: 45000,
    originalPrice: 55000,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    rating: 4.5,
    discount: 18,
    category: "electronics",
  },
  {
    id: "2",
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: 35000,
    originalPrice: 42000,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    rating: 4.8,
    discount: 17,
    category: "electronics",
  },
  {
    id: "3",
    name: "Apple MacBook Air M2",
    price: 145000,
    originalPrice: 165000,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    rating: 4.9,
    discount: 12,
    category: "electronics",
  },
  {
    id: "4",
    name: "Canon EOS R6 Digital Camera",
    price: 285000,
    originalPrice: 320000,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    rating: 4.7,
    discount: 11,
    category: "electronics",
  },
  {
    id: "5",
    name: "LG 55\" 4K Smart TV",
    price: 65000,
    originalPrice: 78000,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
    rating: 4.6,
    discount: 17,
    category: "electronics",
  },
  {
    id: "6",
    name: "iPad Pro 11-inch M2",
    price: 98000,
    originalPrice: 115000,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
    rating: 4.8,
    discount: 15,
    category: "electronics",
  },
  {
    id: "7",
    name: "JBL Flip 6 Bluetooth Speaker",
    price: 8500,
    originalPrice: 11000,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
    rating: 4.5,
    discount: 23,
    category: "electronics",
  },
  {
    id: "8",
    name: "Apple Watch Series 9",
    price: 52000,
    originalPrice: 62000,
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400",
    rating: 4.7,
    discount: 16,
    category: "electronics",
  },
  // Fashion
  {
    id: "9",
    name: "Nike Air Max 270 Running Shoes",
    price: 12000,
    originalPrice: 15000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    rating: 4.6,
    discount: 20,
    category: "fashion",
  },
  {
    id: "10",
    name: "Adidas Ultraboost 22 Sneakers",
    price: 14500,
    originalPrice: 18000,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400",
    rating: 4.5,
    discount: 19,
    category: "fashion",
  },
  {
    id: "11",
    name: "Levi's 501 Original Fit Jeans",
    price: 6500,
    originalPrice: 8500,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    rating: 4.4,
    discount: 24,
    category: "fashion",
  },
  {
    id: "12",
    name: "Calvin Klein Cotton T-Shirt Pack",
    price: 3200,
    originalPrice: 4200,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    rating: 4.3,
    discount: 24,
    category: "fashion",
  },
  {
    id: "13",
    name: "Tommy Hilfiger Classic Polo",
    price: 4500,
    originalPrice: 5800,
    image: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400",
    rating: 4.6,
    discount: 22,
    category: "fashion",
  },
  {
    id: "14",
    name: "Puma Training Tracksuit",
    price: 7800,
    originalPrice: 9500,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
    rating: 4.5,
    discount: 18,
    category: "fashion",
  },
  {
    id: "15",
    name: "Ray-Ban Aviator Sunglasses",
    price: 12500,
    originalPrice: 16000,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
    rating: 4.7,
    discount: 22,
    category: "fashion",
  },
  {
    id: "16",
    name: "Zara Elegant Summer Dress",
    price: 5500,
    originalPrice: 7200,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",
    rating: 4.4,
    discount: 24,
    category: "fashion",
  },
  // Beauty
  {
    id: "17",
    name: "Maybelline SuperStay Matte Ink",
    price: 1200,
    originalPrice: 1500,
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400",
    rating: 4.6,
    discount: 20,
    category: "beauty",
  },
  {
    id: "18",
    name: "L'Oreal Paris Revitalift Serum",
    price: 2800,
    originalPrice: 3500,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
    rating: 4.5,
    discount: 20,
    category: "beauty",
  },
  {
    id: "19",
    name: "Nivea Soft Light Moisturizer",
    price: 850,
    originalPrice: 1100,
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",
    rating: 4.4,
    discount: 23,
    category: "beauty",
  },
  {
    id: "20",
    name: "Garnier Fructis Shampoo & Conditioner",
    price: 1450,
    originalPrice: 1900,
    image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400",
    rating: 4.3,
    discount: 24,
    category: "beauty",
  },
  {
    id: "21",
    name: "MAC Studio Fix Foundation",
    price: 4200,
    originalPrice: 5200,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400",
    rating: 4.7,
    discount: 19,
    category: "beauty",
  },
  {
    id: "22",
    name: "Urban Decay Naked Palette",
    price: 6500,
    originalPrice: 8200,
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400",
    rating: 4.8,
    discount: 21,
    category: "beauty",
  },
  {
    id: "23",
    name: "Clinique Moisture Surge 72hr",
    price: 3800,
    originalPrice: 4800,
    image: "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=400",
    rating: 4.6,
    discount: 21,
    category: "beauty",
  },
  {
    id: "24",
    name: "Dove Body Wash Variety Pack",
    price: 1850,
    originalPrice: 2400,
    image: "https://images.unsplash.com/photo-1628015796818-87c94e8bdd42?w=400",
    rating: 4.5,
    discount: 23,
    category: "beauty",
  },
  // Home & Living
  {
    id: "25",
    name: "Cotton Bedding Set - Queen Size",
    price: 8500,
    originalPrice: 11000,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400",
    rating: 4.5,
    discount: 23,
    category: "home",
  },
  {
    id: "26",
    name: "Decorative Throw Pillows Set of 4",
    price: 3200,
    originalPrice: 4200,
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400",
    rating: 4.4,
    discount: 24,
    category: "home",
  },
  {
    id: "27",
    name: "Modern Area Rug 6x9 ft",
    price: 12500,
    originalPrice: 16000,
    image: "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400",
    rating: 4.6,
    discount: 22,
    category: "home",
  },
  {
    id: "28",
    name: "Kitchen Knife Set 15-Piece",
    price: 5800,
    originalPrice: 7500,
    image: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400",
    rating: 4.7,
    discount: 23,
    category: "home",
  },
  {
    id: "29",
    name: "Non-Stick Cookware Set",
    price: 9800,
    originalPrice: 12500,
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400",
    rating: 4.5,
    discount: 22,
    category: "home",
  },
  {
    id: "30",
    name: "LED Desk Lamp with USB Port",
    price: 2800,
    originalPrice: 3600,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400",
    rating: 4.4,
    discount: 22,
    category: "home",
  },
  {
    id: "31",
    name: "Wall Clock Modern Design",
    price: 1850,
    originalPrice: 2500,
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400",
    rating: 4.3,
    discount: 26,
    category: "home",
  },
  {
    id: "32",
    name: "Vacuum Cleaner 2000W",
    price: 15500,
    originalPrice: 19000,
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400",
    rating: 4.6,
    discount: 18,
    category: "home",
  },
  // Sports
  {
    id: "33",
    name: "Yoga Mat Premium Non-Slip",
    price: 2500,
    originalPrice: 3200,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400",
    rating: 4.5,
    discount: 22,
    category: "sports",
  },
  {
    id: "34",
    name: "Adjustable Dumbbell Set 20kg",
    price: 8500,
    originalPrice: 11000,
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400",
    rating: 4.6,
    discount: 23,
    category: "sports",
  },
  {
    id: "35",
    name: "Wilson Basketball Official Size",
    price: 3200,
    originalPrice: 4000,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
    rating: 4.4,
    discount: 20,
    category: "sports",
  },
  {
    id: "36",
    name: "Fitness Resistance Bands Set",
    price: 1850,
    originalPrice: 2500,
    image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400",
    rating: 4.3,
    discount: 26,
    category: "sports",
  },
  {
    id: "37",
    name: "Nike Dri-FIT Training Shorts",
    price: 2800,
    originalPrice: 3500,
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400",
    rating: 4.5,
    discount: 20,
    category: "sports",
  },
  {
    id: "38",
    name: "Under Armour Gym Bag",
    price: 4200,
    originalPrice: 5500,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
    rating: 4.4,
    discount: 24,
    category: "sports",
  },
  {
    id: "39",
    name: "Jump Rope Speed Training",
    price: 850,
    originalPrice: 1200,
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400",
    rating: 4.2,
    discount: 29,
    category: "sports",
  },
  {
    id: "40",
    name: "Adidas Soccer Ball FIFA Approved",
    price: 4500,
    originalPrice: 5800,
    image: "https://images.unsplash.com/photo-1614632537239-d265ff6b5e98?w=400",
    rating: 4.7,
    discount: 22,
    category: "sports",
  },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState("featured");

  const category = searchParams.get("category") || "";
  const keyword = searchParams.get("keyword") || "";
  const pageNumber = parseInt(searchParams.get("page") || "1");

  const { data: productsData, isLoading, error } = useProducts({
    pageNumber,
    keyword,
    category,
  });

  const products = productsData?.products || [];
  const page = productsData?.page || 1;
  const pages = productsData?.pages || 1;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    // Note: Sorting would need backend implementation
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Products` : keyword ? `Search Results for "${keyword}"` : "All Products"}
              </h1>
              <p className="text-muted-foreground">
                {isLoading ? "Loading products..." : `Showing ${products.length} products`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading products. Please try again.</p>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={product.images?.[0] || "/placeholder.svg"}
                  rating={product.rating}
                  discount={product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : undefined}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && pages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              ))}
              <Button
                variant="outline"
                disabled={page === pages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
