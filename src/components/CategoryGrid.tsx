import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Smartphone, Shirt, Home, Sparkles, Dumbbell, ShoppingBasket, Cpu, Car, Baby, Heart, BookOpen, Wrench, PawPrint, Zap } from "lucide-react";

const categories = [
  { name: "Electronics", icon: Smartphone, slug: "electronics", color: "bg-blue-500" },
  { name: "Fashion", icon: Shirt, slug: "fashion", color: "bg-pink-500" },
  { name: "Home & Living", icon: Home, slug: "home", color: "bg-green-500" },
  { name: "Beauty & Personal Care", icon: Sparkles, slug: "beauty", color: "bg-purple-500" },
  { name: "Supermarket / Groceries", icon: ShoppingBasket, slug: "groceries", color: "bg-yellow-500" },
  { name: "Appliances", icon: Home, slug: "appliances", color: "bg-indigo-500" },
  { name: "Computing & Office", icon: Cpu, slug: "computing", color: "bg-gray-500" },
  { name: "Sports & Outdoors", icon: Dumbbell, slug: "sports", color: "bg-orange-500" },
  { name: "Automotive", icon: Car, slug: "automotive", color: "bg-red-500" },
  { name: "Toys, Kids & Baby", icon: Baby, slug: "toys", color: "bg-cyan-500" },
  { name: "Health & Medical", icon: Heart, slug: "health", color: "bg-rose-500" },
  { name: "Books, Stationery & Art", icon: BookOpen, slug: "books", color: "bg-amber-500" },
  { name: "Garden & Tools", icon: Wrench, slug: "garden", color: "bg-lime-500" },
  { name: "Pet Supplies", icon: PawPrint, slug: "pet", color: "bg-emerald-500" },
  { name: "Deals & Promotions", icon: Zap, slug: "deals", color: "bg-violet-500" },
];

const CategoryGrid = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore our wide range of products across different categories
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.slug} to={`/products?category=${category.slug}`}>
                <Card className="p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer group border-0 bg-card hover:bg-card/80">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className={`${category.color} p-5 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {category.name}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
