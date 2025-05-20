
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
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <a href="https://nectarinelogistics.com/services" target="_blank" rel="noopener noreferrer">
                Services
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <a href="https://nectarinelogistics.com/about/what-is-nectarine" target="_blank" rel="noopener noreferrer">
                About
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <a href="https://nectarinelogistics.com/help" target="_blank" rel="noopener noreferrer">
                Help Centre
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <a href="https://nectarinelogistics.com/shipping-routes" target="_blank" rel="noopener noreferrer">
                Shipping Routes
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <a href="https://nectarinelogistics.com/contact" target="_blank" rel="noopener noreferrer">
                Contact
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
