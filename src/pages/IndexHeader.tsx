
import MainNavigation from "@/components/MainNavigation";

const IndexHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-border">
      <div className="container flex h-16 items-center">
        <div className="mr-4 font-bold text-xl text-nectarine-600">Nectarine</div>
        <MainNavigation />
      </div>
    </header>
  );
};

export default IndexHeader;
