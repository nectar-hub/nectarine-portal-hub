
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
import { LayoutDashboard } from "lucide-react";

const MainNavigation = () => {
  const { user, isAdmin } = useAuth();
  
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link to="/">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Home
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Services</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <a
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-nectarine-50 to-white p-6 no-underline outline-none focus:shadow-md"
                    href="/dashboard/buy-for-me"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium">
                      Buy For Me
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      We purchase products on your behalf from any store in our supported countries
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
              <ListItem href="/dashboard/track-packages" title="Package Tracking">
                Track your packages as they ship to your location
              </ListItem>
              <ListItem href="/dashboard/shipping-address" title="Shipping Address">
                View your shipping address in our supported countries
              </ListItem>
              <ListItem href="/dashboard/orders" title="Orders History">
                View all your past and current orders
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link to="/about">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              About
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link to="/contact">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Contact
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
      
      <div className="ml-auto flex items-center space-x-4">
        {user ? (
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link to={isAdmin ? "/admin" : "/dashboard"}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/login">Login</Link>
          </Button>
        )}
      </div>
    </NavigationMenu>
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
