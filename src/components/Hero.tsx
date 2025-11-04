import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />
      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in leading-tight relative">
            <span className="inline-block animate-pulse">
              <span className="bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 bg-clip-text text-transparent animate-gradient-x">
                Shop Smart
              </span>
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x animation-delay-1000">
              Save Big
            </span>
            {/* Animated lights */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-8 right-12 w-6 h-6 bg-blue-400 rounded-full animate-ping opacity-60 animation-delay-500"></div>
            <div className="absolute bottom-4 left-1/4 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-80 animation-delay-1000"></div>
            <div className="absolute top-1/2 -right-8 w-5 h-5 bg-purple-400 rounded-full animate-ping opacity-70 animation-delay-1500"></div>
            <div className="absolute bottom-8 right-1/3 w-3 h-3 bg-pink-400 rounded-full animate-ping opacity-90 animation-delay-2000"></div>
            {/* Moving trail effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full animate-light-trail">
                <div className="absolute top-1/4 left-0 w-2 h-2 bg-white rounded-full opacity-60"></div>
                <div className="absolute top-1/2 left-0 w-1 h-1 bg-yellow-300 rounded-full opacity-80 animation-delay-300"></div>
                <div className="absolute bottom-1/4 left-0 w-1.5 h-1.5 bg-blue-300 rounded-full opacity-70 animation-delay-600"></div>
              </div>
            </div>
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-primary-foreground/90 leading-relaxed">
            Discover amazing deals on electronics, fashion, home essentials and more.
            Fast delivery across Kenya with secure payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <Link to="/products">
              <Button size="lg" variant="secondary" className="group px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                Shop Now
                <ChevronRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-4 text-lg font-semibold backdrop-blur-sm"
            >
              View Deals
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 w-1/2 h-full bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800')] bg-cover bg-center opacity-30 hidden lg:block" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float animation-delay-2000" />
    </section>
  );
};

export default Hero;
