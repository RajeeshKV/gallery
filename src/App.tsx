import { Layout } from "./components/layout/Layout";
import { AdminPage } from "./components/pages/AdminPage";
import { Footer } from "./components/layout/Footer";
import { GallerySection } from "./components/sections/GallerySection";
import { HeroSection } from "./components/sections/HeroSection";
import { IntroSection } from "./components/sections/IntroSection";
import { SystemSection } from "./components/sections/SystemSection";
import { usePortfolioAssets } from "./hooks/usePortfolioAssets";

function App() {
  const isAdminPage = window.location.pathname.startsWith("/admin");
  const { data, error, isLoading } = usePortfolioAssets();

  if (isAdminPage) {
    return <AdminPage />;
  }

  return (
    <Layout>
      <HeroSection
        slides={data?.carousel ?? []}
        isLoading={isLoading}
        error={error}
      />
      <main className="page-shell">
        <IntroSection />
        <GallerySection assets={data?.gallery ?? []} isLoading={isLoading} />
        <SystemSection />
      </main>
      <Footer />
    </Layout>
  );
}

export default App;
