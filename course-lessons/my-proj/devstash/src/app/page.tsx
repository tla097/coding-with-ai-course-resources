import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Navbar from '@/components/marketing/Navbar'
import HeroSection from '@/components/marketing/HeroSection'
import FeaturesSection from '@/components/marketing/FeaturesSection'
import AiFeaturesSection from '@/components/marketing/AiFeaturesSection'
import PricingSection from '@/components/marketing/PricingSection'
import CtaSection from '@/components/marketing/CtaSection'
import MarketingFooter from '@/components/marketing/Footer'

export default async function HomePage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AiFeaturesSection />
      <PricingSection />
      <CtaSection />
      <MarketingFooter />
    </div>
  )
}
