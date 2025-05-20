
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import IndexHeader from "./IndexHeader";
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <IndexHeader />
      
      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-white to-nectarine-50">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Your Global Shopping Assistant
              </h1>
              <p className="text-xl mb-8 text-gray-600">
                Shop from the USA, UK, China and more - delivered to your doorstep worldwide.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="px-8">
                  <Link to="/dashboard/buy-for-me">Shop Now</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8">
                  <Link to="/dashboard/track-packages">Track Package</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container px-4 mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
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
        <section className="py-16 bg-nectarine-50">
          <div className="container px-4 mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Global Coverage</h2>
            <p className="text-center mb-10 text-gray-600 max-w-2xl mx-auto">
              We operate in major markets around the world to bring you products from anywhere
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-center">
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
        <section className="py-20 bg-nectarine-600 text-white">
          <div className="container px-4 mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Shop Globally?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Create an account today and start shopping from anywhere in the world.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="px-8">
                <Link to="/register">Sign Up Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8 bg-transparent border-white hover:bg-white hover:text-nectarine-600">
                <Link to="/dashboard/buy-for-me">Start Shopping</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#262626] text-white py-12">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/lovable-uploads/6812ca59-9985-4974-8a82-27733d625894.png" alt="Nectarine Logo" className="h-8 w-auto" />
                <h3 className="text-xl font-bold">Nectarine</h3>
              </div>
              <p className="text-gray-400 mb-6 pr-4">
                Welcome to Nectarine, your trusted partner for international shopping and shipping solutions. We connect you to global markets by providing seamless access to products from around the world.
              </p>
              <div className="flex space-x-4 text-gray-400">
                <a href="https://facebook.com" className="hover:text-nectarine-500 transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="https://instagram.com" className="hover:text-nectarine-500 transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="https://linkedin.com" className="hover:text-nectarine-500 transition-colors">
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-nectarine-400">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://nectarinelogistics.com/services/buy-for-me" className="hover:text-nectarine-500 transition-colors">Buy For Me</a></li>
                <li><a href="https://nectarinelogistics.com/services/mail-forwarding" className="hover:text-nectarine-500 transition-colors">Mail Forwarding</a></li>
                <li><a href="https://nectarinelogistics.com/services/shipping-address" className="hover:text-nectarine-500 transition-colors">Shipping Address</a></li>
                <li><a href="https://nectarinelogistics.com/services/store-consolidation" className="hover:text-nectarine-500 transition-colors">Store Consolidation</a></li>
                <li><a href="https://nectarinelogistics.com/services/locker" className="hover:text-nectarine-500 transition-colors">Package Locker</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-nectarine-400">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://nectarinelogistics.com/about/what-is-nectarine" className="hover:text-nectarine-500 transition-colors">About Us</a></li>
                <li><a href="https://nectarinelogistics.com/about/our-mission" className="hover:text-nectarine-500 transition-colors">Our Mission</a></li>
                <li><a href="https://nectarinelogistics.com/careers" className="hover:text-nectarine-500 transition-colors">Careers</a></li>
                <li><a href="https://nectarinelogistics.com/shipping-routes" className="hover:text-nectarine-500 transition-colors">Shipping Routes</a></li>
                <li><a href="https://nectarinelogistics.com/pricing" className="hover:text-nectarine-500 transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-nectarine-400">Contact Us</h4>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <MapPin size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    17401 Nichols LN Unit J,<br />
                    Huntington Beach, CA 92647
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={18} />
                  <span>+1 631 353 7275</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={18} />
                  <a href="mailto:info@nectarinelogistics.com" className="hover:text-nectarine-500 transition-colors">
                    info@nectarinelogistics.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-10 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Nectarine Logistics Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
