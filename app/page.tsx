import Experience from "./components/Experience";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "VJ One",
  url: siteUrl,
  description:
    "Cinematic film production for luxury villas, resorts and high-end real estate.",
  areaServed: "Worldwide",
  address: {
    "@type": "PostalAddress",
    addressCountry: "BR",
  },
  serviceType: [
    "Real Estate Videography",
    "Villa Film Production",
    "Hospitality Content",
    "Motion Design",
  ],
};

export default function Home() {
  return (
    <>
      <Experience />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
