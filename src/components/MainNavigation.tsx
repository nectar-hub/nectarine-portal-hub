
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown,
  LayoutDashboard
} from "lucide-react";
import MobileNav from "./MobileNav";

const MainNavigation = () => {
  const { user, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex items-center justify-end flex-1 gap-4">
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-6 mr-auto">
            <a href="https://nectarinelogistics.com/" className="font-medium hover:text-nectarine-500 transition-colors">
              Home
            </a>

            {/* Services Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 font-medium hover:text-nectarine-500 transition-colors">
                <span>Services</span> 
                <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white p-2">
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/services/online-purchase" className="w-full p-2">Online Purchase</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/services/buy-for-me" className="w-full p-2">Buy For Me</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/services/door-to-door" className="w-full p-2">Door-To-Door</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/services/fulfillment" className="w-full p-2">Fulfillment</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/services/local-delivery" className="w-full p-2">Local Delivery</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/services/sea-air-freight" className="w-full p-2">Sea and Air Freight</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/services/customs-brokerage" className="w-full p-2">Customs Brokerage</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/services/warehousing" className="w-full p-2">Warehousing</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* About Us Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 font-medium hover:text-nectarine-500 transition-colors">
                <span>About Us</span> 
                <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white p-2">
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/about" className="w-full p-2">What is Nectarine</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/about/why-choose-us" className="w-full p-2">Why Choose Us</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/about/membership" className="w-full p-2">Membership Program</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/about/press" className="w-full p-2">Press</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/about/blog" className="w-full p-2">Blog</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/about/reviews" className="w-full p-2">Reviews</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/about/careers" className="w-full p-2">Careers</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help Center Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 font-medium hover:text-nectarine-500 transition-colors">
                <span>Help Center</span> 
                <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white p-2">
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/help/how-it-works" className="w-full p-2">How It Works</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/help/faq" className="w-full p-2">FAQ</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/help/report-issue" className="w-full p-2">Report an Issue</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/help/how-to-guides" className="w-full p-2">How-To Guides</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/help/prohibited-items" className="w-full p-2">Prohibited Items</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/help/insurance-claims" className="w-full p-2">Insurance, Claim & Return Policy</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/help/shipping-tools" className="w-full p-2">Shipping Tools</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/help/privacy-policy" className="w-full p-2">Privacy Policy</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/help/payment-policy" className="w-full p-2">Payment Policy</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/help/terms" className="w-full p-2">Terms & Conditions</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Shipping Routes Dropdown - Only keeping the route links */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 font-medium hover:text-nectarine-500 transition-colors">
                <span>Shipping From</span> 
                <ChevronDown size={16} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white p-2">
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/routes/canada-to-tanzania" className="w-full p-2">Canada to Tanzania</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/routes/china-to-tanzania" className="w-full p-2">China to Tanzania</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/routes/dubai-to-tanzania" className="w-full p-2">Dubai to Tanzania</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/routes/uk-to-tanzania" className="w-full p-2">UK to Tanzania</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/routes/usa-to-tanzania" className="w-full p-2">USA to Tanzania</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/routes/south-korea-to-tanzania" className="w-full p-2">South Korea to Tanzania</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/routes/hong-kong-to-tanzania" className="w-full p-2">Hong Kong to Tanzania</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/routes/france-to-tanzania" className="w-full p-2">France to Tanzania</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/routes/germany-to-tanzania" className="w-full p-2">Germany to Tanzania</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="https://nectarinelogistics.com/routes/netherlands-to-tanzania" className="w-full p-2">Netherlands to Tanzania</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a href="https://nectarinelogistics.com/contact" className="font-medium hover:text-nectarine-500 transition-colors">
              Contact Us
            </a>
      </nav>

      {/* Mobile Navigation */}
      <MobileNav />
      
      <div className="hidden lg:flex items-center space-x-4">
        {user ? (
          <>
            <Button asChild variant="outline" className="items-center gap-2">
              <Link to="/dashboard/orders">Track Order</Link>
            </Button>
            <Button asChild variant="default" className="flex items-center gap-2">
              <Link to={isAdmin ? "/admin" : "/dashboard"}>
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild variant="outline">
              <Link to="/register">Register</Link>
            </Button>
            <Button asChild variant="default">
              <Link to="/login">Login</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};


export default MainNavigation;
