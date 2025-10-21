import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import IndexHeader from "./IndexHeader";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <IndexHeader />
      
      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-nectarine-50">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-gray-900">
                Your Global Shopping Assistant
              </h1>
              <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-gray-600 px-4">
                Shop from the USA, UK, China and more - delivered to your doorstep worldwide.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
                <Button asChild size="lg" className="w-full sm:w-auto px-8">
                  <Link to="/dashboard/buy-for-me">Shop Now</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto px-8">
                  <Link to="/dashboard/track-packages">Add Self Purchase</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="container px-4 mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-nectarine-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-nectarine-600 font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Choose Your Products</h3>
                <p className="text-gray-600">
                  Send us links to products from any store in our supported countries.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-nectarine-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-nectarine-600 font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">We Purchase For You</h3>
                <p className="text-gray-600">
                  Our team buys the items and prepares them for international shipping.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 bg-nectarine-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-nectarine-600 font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Receive At Your Door</h3>
                <p className="text-gray-600">
                  We handle customs and delivery to bring your purchases right to you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Global Coverage Section */}
        <section className="py-12 sm:py-16 bg-nectarine-50">
          <div className="container px-4 mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 sm:mb-4">Global Coverage</h2>
            <p className="text-center mb-6 sm:mb-10 text-gray-600 max-w-2xl mx-auto px-4 text-sm sm:text-base">
              We operate in major markets around the world to bring you products from anywhere
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-center px-4">
              <div className="bg-white px-8 py-4 rounded-lg shadow-sm">
                <p className="font-semibold">United States</p>
              </div>
              <div className="bg-white px-8 py-4 rounded-lg shadow-sm">
                <p className="font-semibold">United Kingdom</p>
              </div>
              <div className="bg-white px-8 py-4 rounded-lg shadow-sm">
                <p className="font-semibold">China</p>
              </div>
              <div className="bg-white px-8 py-4 rounded-lg shadow-sm">
                <p className="font-semibold">UAE</p>
              </div>
              <div className="bg-white px-8 py-4 rounded-lg shadow-sm">
                <p className="font-semibold">Germany</p>
              </div>
              <div className="bg-white px-8 py-4 rounded-lg shadow-sm">
                <p className="font-semibold">And more...</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-nectarine-600 text-white">
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Ready to Shop Globally?</h2>
            <p className="text-base sm:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Create an account today and start shopping from anywhere in the world.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto px-8">
                <Link to="/register">Sign Up Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto px-8 bg-transparent border-white hover:bg-white hover:text-nectarine-600">
                <Link to="/dashboard/buy-for-me">Start Shopping</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
