
import MainNavigation from "@/components/MainNavigation";
import { Link } from "react-router-dom";

const IndexHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-border">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <img src="/lovable-uploads/6812ca59-9985-4974-8a82-27733d625894.png" alt="Nectarine Logo" className="h-10 w-auto" />
          <div className="font-bold text-xl text-nectarine-600 hidden sm:block">Nectarine</div>
        </Link>
        <MainNavigation />
      </div>
    </header>
  );
};

export default IndexHeader;
