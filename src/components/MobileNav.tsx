import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <div className="flex flex-col space-y-4 mt-4">
            <a 
              href="https://nectarinelogistics.com/" 
              className="text-lg font-medium hover:text-nectarine-500 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </a>
            <a 
              href="https://nectarinelogistics.com/services" 
              className="text-lg font-medium hover:text-nectarine-500 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Services
            </a>
            <a 
              href="https://nectarinelogistics.com/about" 
              className="text-lg font-medium hover:text-nectarine-500 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </a>
            <a 
              href="https://nectarinelogistics.com/help" 
              className="text-lg font-medium hover:text-nectarine-500 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Help Center
            </a>
            <a 
              href="https://nectarinelogistics.com/shipping-routes" 
              className="text-lg font-medium hover:text-nectarine-500 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Shipping From
            </a>
            <a 
              href="https://nectarinelogistics.com/contact" 
              className="text-lg font-medium hover:text-nectarine-500 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Contact Us
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;