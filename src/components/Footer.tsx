import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram,
  Send 
} from "lucide-react";

const Footer = () => {
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Newsletter subscription submitted");
  };

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info - Updated to place text next to logo */}
          <div className="lg:col-span-2">
            <div className="flex items-start gap-4 mb-6">
              <img 
                src="/lovable-uploads/fb9c7a09-84af-4223-aa99-d2c960cbdd8f.png" 
                alt="Nectarine Logistics" 
                className="h-auto w-[100px] object-contain"
              />
              <p className="text-gray-300">
                Your trusted partner for global logistics solutions. We connect businesses 
                and people across borders with reliable, efficient shipping services.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin size={18} className="text-nectarine-400" />
                <span className="text-gray-300">Unit 1, 7th Floor, Tanzanite Park, Ursiro Street, Victoria, Dar es Salaam, Tanzania</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-nectarine-400" />
                <span className="text-gray-300">+255 744 484 271</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-nectarine-400" />
                <span className="text-gray-300">info@nectarinelogistics.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-nectarine-400" />
                <span className="text-gray-300">sales@nectarinelogistics.com</span>
              </div>
            </div>
            <div className="mt-6 flex space-x-4">
              <a 
                href="https://web.facebook.com/profile.php?id=61567516780613" 
                className="text-gray-400 hover:text-nectarine-400 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.instagram.com/nectarinelogistics/" 
                className="text-gray-400 hover:text-nectarine-400 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-nectarine-300">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://nectarinelogistics.com/" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="https://nectarinelogistics.com/services" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="https://nectarinelogistics.com/about/what-is-nectarine" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="https://nectarinelogistics.com/help" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="https://nectarinelogistics.com/shipping-routes" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Shipping Routes
                </a>
              </li>
              <li>
                <a href="https://nectarinelogistics.com/contact" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Popular Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-nectarine-300">Popular Services</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://nectarinelogistics.com/services/door-to-door" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Door-to-Door Delivery
                </a>
              </li>
              <li>
                <a href="https://nectarinelogistics.com/services/online-purchase" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Online Purchase
                </a>
              </li>
              <li>
                <a href="https://nectarinelogistics.com/services/sea-air-freight" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Sea & Air Freight
                </a>
              </li>
              <li>
                <a href="https://nectarinelogistics.com/services/buy-for-me" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Buy For Me
                </a>
              </li>
              <li>
                <a href="https://nectarinelogistics.com/services/customs-brokerage" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Customs Brokerage
                </a>
              </li>
              <li>
                <a href="https://nectarinelogistics.com/services/warehousing" className="text-gray-300 hover:text-nectarine-400 transition-colors">
                  Warehousing
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-nectarine-300">Newsletter</h3>
            <p className="text-gray-300 mb-4">
              Subscribe to receive updates on new services and special offers.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex">
                <Input 
                  type="email" 
                  placeholder="Your Email Address" 
                  className="rounded-r-none focus-visible:ring-nectarine-400 bg-gray-800 border-gray-700 text-white" 
                  required
                />
                <Button 
                  type="submit" 
                  className="rounded-l-none bg-nectarine-500 hover:bg-nectarine-600"
                >
                  <Send size={18} />
                </Button>
              </div>
            </form>
            <div className="mt-6">
              <Button 
                className="bg-nectarine-500 hover:bg-nectarine-600 w-full"
                asChild
              >
                <a href="https://nectarinelogistics.com/get-quote">Get a Quote</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Nectarine Logistics. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center space-x-4 text-sm text-gray-400">
              <a href="https://nectarinelogistics.com/help/terms" className="hover:text-nectarine-400 transition-colors mb-2 md:mb-0">
                Terms & Conditions
              </a>
              <a href="https://nectarinelogistics.com/help/privacy-policy" className="hover:text-nectarine-400 transition-colors mb-2 md:mb-0">
                Privacy Policy
              </a>
              <a href="https://nectarinelogistics.com/help/payment-policy" className="hover:text-nectarine-400 transition-colors mb-2 md:mb-0">
                Payment Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;