import { Header } from "@/components/header/Header";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Highlights } from "@/components/sections/Highlights";
import { StartScreen } from "@/components/worlds/StartScreen";
import { WorldWipe } from "@/components/worlds/WorldWipe";
import { OffPitch } from "@/components/sections/OffPitch";
import { Pundit } from "@/components/sections/Pundit";
import { Lineup, TeamTalk, Timeline } from "@/components/sections/Story";
import { SITE } from "@/content/site";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  jobTitle: SITE.role,
  worksFor: { "@type": "Organization", name: SITE.employer },
  address: { "@type": "PostalAddress", addressLocality: SITE.city, addressCountry: "IN" },
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Manipal Institute of Technology" },
    { "@type": "School", name: "Mayo College" },
  ],
  email: `mailto:${SITE.email}`,
  sameAs: [SITE.links.github, SITE.links.linkedin, SITE.links.printsafe],
  knowsAbout: ["Computer vision", "Machine learning", "YOLOv8", "PyTorch", "FastAPI", "Next.js"],
};

export default function Home() {
  return (
    <>
      <StartScreen />
      <WorldWipe />
      <div className="va-progress" aria-hidden="true" />
      <Header />
      <main id="main">
        <Hero />
        <TeamTalk />
        <Lineup />
        <Timeline />
        <Highlights />
        <OffPitch />
        <Pundit />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
