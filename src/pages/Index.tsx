
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Globe, Truck, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/6812ca59-9985-4974-8a82-27733d625894.png" 
              alt="Nectarine Logistics" 
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold text-nectarine-600">Nectarine Portal</span>
          </Link>
          <div className="flex space-x-2">
            <Link to="/login">
              <Button variant="outline" size={isMobile ? "sm" : "default"}>
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button 
                className="nectarine-gradient hover:opacity-90 transition-opacity text-white"
                size={isMobile ? "sm" : "default"}
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 md:py-24 bg-gradient-to-b from-nectarine-50 to-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
                Your Global Shopping <span className="text-nectarine-600">Assistant</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Shop from USA, UK, China, and more - we'll handle the shipping, customs, and delivery to your doorstep.
              </p>
              <div className="space-x-4 pt-4">
                <Link to="/register">
                  <Button 
                    className="nectarine-gradient hover:opacity-90 transition-opacity text-white"
                    size="lg"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <img 
                src="/lovable-uploads/6812ca59-9985-4974-8a82-27733d625894.png"
                alt="Nectarine Logistics" 
                className="h-64 w-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="text-xl text-muted-foreground mt-4">
              We make international shopping simple and convenient
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-nectarine-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-nectarine-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Buy For Me</h3>
              <p className="text-muted-foreground">
                Send us product links and we'll purchase items on your behalf from stores worldwide.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-nectarine-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-nectarine-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ship to Our Address</h3>
              <p className="text-muted-foreground">
                Use our local addresses to shop directly from international retailers.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-nectarine-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-nectarine-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">We Deliver to You</h3>
              <p className="text-muted-foreground">
                Track your packages every step of the way until they arrive at your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Coverage */}
      <section className="py-12 md:py-24 bg-gradient-to-b from-background to-nectarine-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-card rounded-xl shadow-lg border border-border p-8 flex items-center justify-center">
                <Globe className="h-24 w-24 text-nectarine-500" />
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <h2 className="text-3xl font-bold text-foreground">Global Coverage</h2>
              <p className="text-xl text-muted-foreground">
                Access products from top international markets with our worldwide shipping network.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-nectarine-500 mr-2"></div>
                  <span>United States</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-nectarine-500 mr-2"></div>
                  <span>United Kingdom</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-nectarine-500 mr-2"></div>
                  <span>China</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-nectarine-500 mr-2"></div>
                  <span>UAE</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-nectarine-500 mr-2"></div>
                  <span>Germany</span>
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-nectarine-500 mr-2"></div>
                  <span>And more countries...</span>
                </li>
              </ul>
              <div className="pt-4">
                <Link to="/register">
                  <Button 
                    className="nectarine-gradient hover:opacity-90 transition-opacity text-white"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 flex items-center gap-2">
              <img 
                src="/lovable-uploads/6812ca59-9985-4974-8a82-27733d625894.png" 
                alt="Nectarine Logistics" 
                className="h-8 w-auto"
              />
              <div>
                <p className="text-lg font-bold text-nectarine-600">Nectarine Portal</p>
                <p className="text-sm text-muted-foreground">Your Global Shopping Assistant</p>
              </div>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="text-muted-foreground hover:text-nectarine-600 transition-colors">
                Home
              </Link>
              <Link to="/login" className="text-muted-foreground hover:text-nectarine-600 transition-colors">
                Login
              </Link>
              <Link to="/register" className="text-muted-foreground hover:text-nectarine-600 transition-colors">
                Register
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-4 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Nectarine Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
