import HomeHeader from "@/components/home/header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <HomeHeader className="mb-4 mt-6 h-12" />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
