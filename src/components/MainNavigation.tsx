
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, ChevronDown } from "lucide-react";

const MainNavigation = () => {
  const { user, isAdmin } = useAuth();
  
  return (
    <div className="flex w-full items-center">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <a href="https://nectarinelogistics.com/" target="_blank" rel="noopener noreferrer">
                Home
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuTrigger>Services</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                <ListItem
                  href="https://nectarinelogistics.com/services/door-to-door"
                  title="Door-to-Door Delivery"
                >
                  Complete pickup and delivery service with real-time tracking.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/services/online-purchase"
                  title="Online Purchase"
                >
                  Shop from Amazon, eBay, AliExpress & 1000+ stores.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/services/sea-air-freight"
                  title="Sea & Air Freight"
                >
                  Cost-effective shipping for bulk items and cargo.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/services/buy-for-me"
                  title="Buy For Me"
                >
                  Personal shopping service for international purchases.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/services/customs-brokerage"
                  title="Customs Brokerage"
                >
                  Expert customs clearance and documentation.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/services/warehousing"
                  title="Warehousing"
                >
                  Secure storage and consolidation services.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>About Us</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <a
                      className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                      href="https://nectarinelogistics.com/about/what-is-nectarine"
                    >
                      <div className="mb-2 mt-4 text-lg font-medium">
                        Nectarine Logistics
                      </div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        Your trusted partner for international shipping and logistics solutions.
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <ListItem href="https://nectarinelogistics.com/about/what-is-nectarine" title="What is Nectarine">
                  Learn about our mission and values.
                </ListItem>
                <ListItem href="https://nectarinelogistics.com/about/our-team" title="Our Team">
                  Meet the experts behind our services.
                </ListItem>
                <ListItem href="https://nectarinelogistics.com/about/careers" title="Careers">
                  Join our growing team worldwide.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Help Center</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                <ListItem
                  href="https://nectarinelogistics.com/help/faq"
                  title="FAQ"
                >
                  Find answers to commonly asked questions.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/help/shipping-guide"
                  title="Shipping Guide"
                >
                  Step-by-step guide to using our services.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/help/terms"
                  title="Terms & Conditions"
                >
                  Our service terms and conditions.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/help/privacy-policy"
                  title="Privacy Policy"
                >
                  How we protect your personal information.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/help/payment-policy"
                  title="Payment Policy"
                >
                  Payment methods and billing information.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/help/contact"
                  title="Contact Support"
                >
                  Get in touch with our support team.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Shipping From</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                <ListItem
                  href="https://nectarinelogistics.com/shipping-routes/usa"
                  title="United States"
                >
                  Ship from USA to Tanzania and worldwide.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/shipping-routes/uk"
                  title="United Kingdom"
                >
                  Ship from UK to Tanzania and worldwide.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/shipping-routes/china"
                  title="China"
                >
                  Ship from China to Tanzania and worldwide.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/shipping-routes/uae"
                  title="UAE"
                >
                  Ship from UAE to Tanzania and worldwide.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/shipping-routes/germany"
                  title="Germany"
                >
                  Ship from Germany to Tanzania and worldwide.
                </ListItem>
                <ListItem
                  href="https://nectarinelogistics.com/shipping-routes"
                  title="All Routes"
                >
                  View all available shipping routes.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <a href="https://nectarinelogistics.com/contact" target="_blank" rel="noopener noreferrer">
                Contact Us
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      
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

const ListItem = ({
  className,
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
};

export default MainNavigation;
