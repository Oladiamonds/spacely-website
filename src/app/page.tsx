import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import CategoryTicker from '@/components/CategoryTicker'
import WhySpaceLY from '@/components/WhySpaceLY'
import ForArtisans from '@/components/ForArtisans'
import HowItWorks from '@/components/HowItWorks'
import TrustSection from '@/components/TrustSection'
import SocialProof from '@/components/SocialProof'
import CTASection from '@/components/CTASection'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <CategoryTicker />
        <WhySpaceLY />
        <ForArtisans />
        <HowItWorks />
        <TrustSection />
        <SocialProof />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
