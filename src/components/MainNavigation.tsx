
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
    <div className="flex w-full items-center">
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center space-x-8 mx-auto">
        <Link to="/" className={`font-medium ${location.pathname === "/" ? "text-nectarine-500" : "hover:text-nectarine-500 transition-colors"}`}>
          Home
        </Link>

        {/* Services Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-1 font-medium hover:text-nectarine-500 transition-colors">
            <span>Services</span> 
            <ChevronDown size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white p-2">
            <DropdownMenuItem asChild>
              <Link to="/services/online-purchase" className={`w-full p-2 ${location.pathname === "/services/online-purchase" ? "text-nectarine-500 font-medium" : ""}`}>Online Purchase</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/services/buy-for-me" className="w-full p-2">Buy For Me</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/services/door-to-door" className="w-full p-2">Door-To-Door</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/services/fulfillment" className="w-full p-2">Fulfillment</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/services/local-delivery" className="w-full p-2">Local Delivery</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/services/sea-air-freight" className="w-full p-2">Sea and Air Freight</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/services/customs-brokerage" className="w-full p-2">Customs Brokerage</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/services/warehousing" className="w-full p-2">Warehousing</Link>
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
              <Link to="/about" className={`w-full p-2 ${location.pathname === "/about" ? "text-nectarine-500 font-medium" : ""}`}>What is Nectarine</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/about/why-choose-us" className="w-full p-2">Why Choose Us</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/about/membership" className="w-full p-2">Membership Program</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/about/press" className="w-full p-2">Press</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/about/blog" className="w-full p-2">Blog</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/about/reviews" className="w-full p-2">Reviews</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/about/careers" className="w-full p-2">Careers</Link>
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
              <Link to="/help/how-it-works" className={`w-full p-2 ${location.pathname === "/help/how-it-works" ? "text-nectarine-500 font-medium" : ""}`}>How It Works</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help/faq" className="w-full p-2">FAQ</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help/report-issue" className="w-full p-2">Report an Issue</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help/how-to-guides" className="w-full p-2">How-To Guides</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help/prohibited-items" className="w-full p-2">Prohibited Items</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help/insurance-claims" className="w-full p-2">Insurance, Claim & Return Policy</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help/shipping-tools" className="w-full p-2">Shipping Tools</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help/privacy-policy" className="w-full p-2">Privacy Policy</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help/payment-policy" className="w-full p-2">Payment Policy</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help/terms" className="w-full p-2">Terms & Conditions</Link>
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
              <Link to="/routes/canada-to-tanzania" className={`w-full p-2 ${location.pathname === "/routes/canada-to-tanzania" ? "text-nectarine-500 font-medium" : ""}`}>Canada to Tanzania</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/routes/china-to-tanzania" className={`w-full p-2 ${location.pathname === "/routes/china-to-tanzania" ? "text-nectarine-500 font-medium" : ""}`}>China to Tanzania</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/routes/dubai-to-tanzania" className={`w-full p-2 ${location.pathname === "/routes/dubai-to-tanzania" ? "text-nectarine-500 font-medium" : ""}`}>Dubai to Tanzania</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/routes/uk-to-tanzania" className={`w-full p-2 ${location.pathname === "/routes/uk-to-tanzania" ? "text-nectarine-500 font-medium" : ""}`}>UK to Tanzania</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/routes/usa-to-tanzania" className={`w-full p-2 ${location.pathname === "/routes/usa-to-tanzania" ? "text-nectarine-500 font-medium" : ""}`}>USA to Tanzania</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/routes/south-korea-to-tanzania" className={`w-full p-2 ${location.pathname === "/routes/south-korea-to-tanzania" ? "text-nectarine-500 font-medium" : ""}`}>South Korea to Tanzania</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/routes/hong-kong-to-tanzania" className={`w-full p-2 ${location.pathname === "/routes/hong-kong-to-tanzania" ? "text-nectarine-500 font-medium" : ""}`}>Hong Kong to Tanzania</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/routes/france-to-tanzania" className={`w-full p-2 ${location.pathname === "/routes/france-to-tanzania" ? "text-nectarine-500 font-medium" : ""}`}>France to Tanzania</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/routes/germany-to-tanzania" className={`w-full p-2 ${location.pathname === "/routes/germany-to-tanzania" ? "text-nectarine-500 font-medium" : ""}`}>Germany to Tanzania</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/routes/netherlands-to-tanzania" className={`w-full p-2 ${location.pathname === "/routes/netherlands-to-tanzania" ? "text-nectarine-500 font-medium" : ""}`}>Netherlands to Tanzania</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link to="/contact" className={`font-medium ${location.pathname === "/contact" ? "text-nectarine-500" : "hover:text-nectarine-500 transition-colors"}`}>
          Contact Us
        </Link>
      </nav>

      {/* Mobile Navigation */}
      <MobileNav />
      
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <Button asChild variant="outline" className="hidden md:flex items-center gap-2">
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
