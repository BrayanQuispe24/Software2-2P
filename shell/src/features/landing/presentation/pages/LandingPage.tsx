import React, { useEffect } from 'react';
import '../styles/landing.css';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { DisciplinesGrid } from '../components/DisciplinesGrid';
import { HowItWorks } from '../components/HowItWorks';
import { MobileAppShowcase } from '../components/MobileAppShowcase';
import { EcosystemRoles } from '../components/EcosystemRoles';
import { PricingPlans } from '../components/PricingPlans';
import { CtaBanner } from '../components/CtaBanner';
import { Footer } from '../components/Footer';
import { LeadBookingModal } from '../components/LeadBookingModal';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Apex Fitness Club - Salud, Deporte & Alto Rendimiento';
  }, []);

  return (
    <div className="landing-wrapper">
      <Navbar />
      <main>
        <HeroSection />
        <DisciplinesGrid />
        <HowItWorks />
        <MobileAppShowcase />
        <EcosystemRoles />
        <PricingPlans />
        <CtaBanner />
      </main>
      <Footer />
      <LeadBookingModal />
    </div>
  );
};

export default LandingPage;
