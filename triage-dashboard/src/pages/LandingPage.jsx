import DashboardSection from "../components/landing/DashboardSection";
import DeviceSection from "../components/landing/DeviceSection";
import Hero from "../components/landing/Hero";
import LandingFooter from "../components/landing/LandingFooter";
import LandingNavbar from "../components/landing/LandingNavbar";

function LandingPage() {
  return (
    <div className="landing-root min-h-screen bg-white text-ink-700 antialiased">
      <LandingNavbar />
      <main>
        <Hero />
        <DashboardSection />
        <DeviceSection />
      </main>
      <LandingFooter />
    </div>
  );
}

export default LandingPage;
