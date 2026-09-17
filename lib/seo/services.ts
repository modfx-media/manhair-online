/**
 * Man Hair — Services data model.
 * Source: ModFX Media "Website Build & Programmatic SEO Specification" (Section 3).
 *
 * These 8 pages are NOT synonyms to Google — each targets a distinct
 * search-term cluster and must lead with its own vocabulary. Do not merge
 * copy between services or use the terms interchangeably within a page.
 */

export type ServiceFAQ = { question: string; answer: string };

export type Service = {
  slug: string;
  /** Display name used in H1s / nav. */
  name: string;
  /** Primary keyword this page targets. */
  primaryKeyword: string;
  /** Short reason this is a separate page (internal reference only). */
  rationale: string;
  /** One-sentence plain-language definition (feeds AI Overviews). */
  whatItIs: string;
  /** Unique 120–160 character meta description. */
  metaDescription: string;
  /** Who this service suits. */
  whoItsFor: string;
  /** Base/material options for the "Materials / options" block. */
  materials: string[];
  /** How this differs from the other 7 services / from a transplant. */
  comparison: string;
  /** Two-paragraph unique long-form intro, distinct vocabulary per page. */
  overview: [string, string];
  /** 5 unique benefit bullets. */
  benefits: string[];
  /** 4 "is this you?" candidacy bullets. */
  signs: string[];
  /** 4 unique Q&A pairs. Rendered as plain content only — no FAQPage
   *  schema here (that stays exclusive to /faq/ per spec Section 7.2). */
  faqs: ServiceFAQ[];
  /** 4-5 related search phrases, shown as an "also searched as" chip row.
   *  Real alternate terms only, never repeated keyword stuffing. */
  relatedSearches: string[];
  /** 4 practical, service-specific day-to-day care & maintenance tips. */
  careTips: string[];
  /** Unique existing photo for this service. Do not reuse across services. */
  image: string;
  /** Extra photos shown on this service page only. */
  gallery?: ReadonlyArray<{ src: string; alt: string }>;
  galleryKicker?: string;
  galleryTitle?: { lead: string; accent: string };
};

export const SERVICES: Service[] = [
  {
    slug: "mens-hair-replacement-systems",
    image: "/images/mens-hair-replacement-systems/1.webp",
    galleryKicker: "The result",
    galleryTitle: { lead: "Custom-built.", accent: "Same-day coverage." },
    gallery: [
      {
        src: "/images/mens-hair-replacement-systems/2.jpeg",
        alt: "Before and after a men's hair replacement system on the crown",
      },
      {
        src: "/images/mens-hair-replacement-systems/3.jpg",
        alt: "Before and after a men's hair replacement system in profile",
      },
      {
        src: "/images/mens-hair-replacement-systems/4.jpg",
        alt: "Styled hair replacement system with a before inset",
      },
      {
        src: "/images/mens-hair-replacement-systems/5.jpg",
        alt: "Four-angle before and after of a men's hair replacement system",
      },
    ],
    name: "Men's Hair Replacement Systems",
    primaryKeyword: "hair replacement systems for men",
    rationale: "Core pillar service. Custom human-hair systems, fitted and maintained.",
    whatItIs:
      "A men's hair replacement system is a custom-made overlay of real human hair, built to match your natural color, density, and hairline, then bonded to your scalp so it moves and wears like your own hair.",
    metaDescription:
      "The ManHair pillar service: a custom human-hair system built for your hairline and density, fitted at our Orange, CA studio.",
    whoItsFor:
      "Men at any stage of hair loss, from early thinning to a full bald crown, who want a non-surgical, immediately-visible result.",
    materials: ["Lace base", "Skin (polyurethane) base", "Mono (monofilament) base", "100% real human hair"],
    comparison:
      "This is the umbrella service every other page on this list is a variation of. If you're not sure which term describes what you're picturing, start here.",
    overview: [
      "Every hair replacement system starts the same way: a real assessment of your hair loss pattern, scalp coverage, and the density and texture of the hair you still have, so the piece we build matches you instead of a generic template.",
      "From there we select a base, lace for breathability and the most natural hairline, skin for durability, or mono for a blend of both, then source and color-match 100% real human hair before cutting it in by hand at our Orange, CA studio.",
    ],
    benefits: [
      "A full, natural-looking head of hair from the day of your fitting, not months of waiting to see results.",
      "Custom base and density built around your exact scalp coverage needs, not a one-size template.",
      "Real human hair, color-matched strand by strand to your natural shade and texture.",
      "Zero surgery, zero incisions, and zero recovery downtime.",
      "Ongoing studio support: reattachment, cleaning, and cut-ins to keep it looking like day one.",
    ],
    signs: [
      "You're seeing thinning at the crown, temples, or hairline and want a result you can see immediately.",
      "You've looked into hair transplants but want to avoid surgery, scarring, or months of regrowth.",
      "You want a piece built to your own head shape and hair pattern, not pulled off a shelf.",
      "You're looking for a long-term solution with professional maintenance built in, not a one-time fix.",
    ],
    faqs: [
      {
        question: "How is a hair replacement system different from a wig?",
        answer:
          "A wig covers the entire head; a hair replacement system is built to blend with the hair you still have, matched to your exact density and hairline so the transition is invisible.",
      },
      {
        question: "How long does a system last before it needs replacing?",
        answer:
          "Most systems last six months to a year with regular maintenance, depending on the base you choose and how it's cared for. We'll walk you through the schedule at your fitting.",
      },
      {
        question: "Will people be able to tell I'm wearing a system?",
        answer:
          "No. A properly fitted lace or skin base, matched to your scalp tone and color-matched hair, is designed to be undetectable, even up close.",
      },
      {
        question: "Do I need surgery or downtime to get started?",
        answer:
          "None. There's no procedure, no incisions, and no recovery period. You can leave your first fitting with a full head of hair.",
      },
    ],
    relatedSearches: [
      "hair replacement systems for men",
      "hair systems near me",
      "non surgical hair replacement",
      "hair system cost",
      "best hair system for men",
    ],
    careTips: [
      "Clean the base every few days with a gentle, alcohol-free cleanser to prevent adhesive buildup.",
      "Avoid high-heat styling tools directly on the bonded edge; leave heat styling near the hairline to your stylist.",
      "Sleep with a soft bonnet or scarf to reduce friction on the lace overnight.",
      "Book reattachment every four to six weeks rather than waiting until the edges start to lift.",
    ],
  },
  {
    slug: "mens-hair-systems",
    image: "/images/homepage-images/mens-hair-systems.jpg",
    name: "Men's Hair Systems",
    primaryKeyword: "hair systems for men near me",
    rationale: "High-volume search term. Distinct page from the pillar.",
    whatItIs:
      "A hair system is a precision-fitted hairpiece built from your own measurements and hair pattern, designed to be worn full-time and blend seamlessly with your existing hair.",
    metaDescription:
      "A precision-fitted men's hair system for full-time wear. Custom color and density, cut in at ManHair in Orange County, CA.",
    whoItsFor:
      "Men searching for a local, near-me fitting who want a discreet, everyday solution rather than a one-time cosmetic fix.",
    materials: ["Lace base", "Skin base", "Blended density matching", "Custom color ring matching"],
    comparison:
      "Where 'hair replacement system' is the clinical umbrella term, 'hair system' is how most men actually search for the everyday, wear-it-daily product.",
    overview: [
      "A hair system is built the same way a tailor builds a suit: your measurements, your hair pattern, your density goals, then a base and blend that's yours alone, designed to be worn full-time rather than taken on and off.",
      "Because it's meant for daily wear, we prioritize breathability and a natural hairline in the fitting, so it holds up through workouts, showers, and normal life without looking like an add-on.",
    ],
    benefits: [
      "Fitted to your exact measurements, not a stock size.",
      "Built for full-time, everyday wear, not just special occasions.",
      "Breathable lace or skin base that holds up through workouts and showers.",
      "Blended density and color-matching so it reads as your own hair.",
      "Local, in-person fittings and maintenance at our Orange, CA studio.",
    ],
    signs: [
      "You searched for a hair system near you because you want an in-person fitting, not a mail-order kit.",
      "You want something you can wear every day, not just for photos or events.",
      "You're comparing local providers and want to see the fit and finish before committing.",
      "You want a system that holds up to an active daily routine.",
    ],
    faqs: [
      {
        question: "Is a hair system the same as a hair replacement system?",
        answer:
          "Yes, same product. 'Hair system' is simply the everyday term most people search for a wear-it-daily piece; 'hair replacement system' is the broader clinical name for the same category.",
      },
      {
        question: "Can I wear a hair system every day?",
        answer:
          "Yes, that's what it's built for. With correct fitting and regular maintenance, most clients wear their system full-time, including through workouts and showers.",
      },
      {
        question: "Do you fit hair systems in person?",
        answer:
          "Yes, every fitting happens at our Orange, CA studio, so we can measure your exact head shape and hair pattern rather than guessing from photos.",
      },
      {
        question: "How often do I need to come in for upkeep?",
        answer:
          "Most clients come in every four to six weeks for reattachment and cleaning, though it varies with how active your lifestyle is.",
      },
    ],
    relatedSearches: [
      "hair systems for men near me",
      "mens hair system",
      "hair system fitting",
      "hair unit for men",
      "hair replacement near me",
    ],
    careTips: [
      "Rinse after workouts to clear sweat and product buildup before it breaks down the bond.",
      "Use a sulfate-free shampoo to protect both the base and the human hair fibers.",
      "Pat the hairline dry rather than rubbing it, to protect the lace edge.",
      "Keep a standing reattachment schedule; daily wear puts more strain on the bond than occasional wear.",
    ],
  },
  {
    slug: "mens-toupees",
    image: "/images/mens-toupees/1.jpg",
    galleryKicker: "Modern toupee",
    galleryTitle: { lead: "Not your father's", accent: "toupee." },
    gallery: [
      {
        src: "/images/mens-toupees/2.jpg",
        alt: "A modern men's toupee shown as a full-coverage crown addition",
      },
      {
        src: "/images/mens-toupees/3.jpg",
        alt: "Styled men's toupee with lace base and mannequin fitting views",
      },
      {
        src: "/images/mens-toupees/4.jpg",
        alt: "Six modern hairstyles achieved with a men's toupee",
      },
    ],
    name: "Men's Toupees",
    primaryKeyword: "toupee near me",
    rationale: "Older, high-intent term. Owns the 'toupee' search cluster.",
    whatItIs:
      "A toupee is a hairpiece that covers the crown and top of the head, the classic term for a men's hair addition, now built with modern lace and skin bases instead of the visible wefts of the past.",
    metaDescription:
      "Modern men's toupees with lace or skin bases, fitted at ManHair in Orange, CA. Crown and top coverage without surgery or downtime.",
    whoItsFor:
      "Men who already know the word 'toupee' and are searching with that vocabulary, typically those comparing older solutions against modern systems.",
    materials: ["Lace front", "Skin crown", "Natural hairline taper", "Real human hair"],
    comparison:
      "Modern toupees are undetectable and nothing like the visible pieces of decades past, but we keep the familiar name since that's the term searchers use.",
    overview: [
      "The word 'toupee' still carries an image from decades ago: an obvious hairpiece with a visible edge. Modern toupees have nothing in common with that; today's version uses the same lace and skin bases, real human hair, and hand-tied hairlines as any other system we build.",
      "If you already know this piece by the term 'toupee,' that's fine, what matters is the fit. We build the crown and hairline to match your own hair growth pattern so the coverage looks like it's growing from your scalp, not sitting on top of it.",
    ],
    benefits: [
      "Modern lace-front and skin-crown construction, not the visible wefts of old-style toupees.",
      "A natural, tapered hairline built to match how your hair actually grows in.",
      "Real human hair, not synthetic fiber that shines or tangles.",
      "Fitted and cut in at our studio, not shipped as a generic size.",
      "The same craftsmanship as our other systems, under the name you already know.",
    ],
    signs: [
      "You've used the word 'toupee' your whole life and want a modern version of what you're picturing.",
      "You're comparing an old hairpiece you or someone you know wore years ago against what's available today.",
      "You want crown and top coverage specifically, not a full-cap solution.",
      "You want a natural hairline that doesn't look like an obvious add-on.",
    ],
    faqs: [
      {
        question: "Do modern toupees look fake like old ones did?",
        answer:
          "No. Older toupees used visible wefts and a hard edge; modern ones use lace or skin bases with a hand-tapered hairline built to match your natural growth pattern.",
      },
      {
        question: "What's the difference between a toupee and a hair system?",
        answer:
          "None in construction, they're the same modern product. 'Toupee' is simply the term some clients already know and search for.",
      },
      {
        question: "Can a toupee be color-matched to my remaining hair?",
        answer:
          "Yes, we match color, texture, and density to your existing hair so the piece blends rather than standing out.",
      },
      {
        question: "How is a toupee attached?",
        answer:
          "The same medical-grade adhesive and bonding methods used across our systems, fitted and applied at our Orange, CA studio.",
      },
    ],
    relatedSearches: [
      "toupee near me",
      "mens toupee",
      "toupee for hair loss",
      "modern toupee",
      "toupee vs hair system",
    ],
    careTips: [
      "Brush the crown gently front-to-back to keep the tapered hairline lying naturally.",
      "Unbond from the perimeter first when removing it; avoid pulling by the front edge.",
      "Have the crown reshaped every few visits as your own hair regrows underneath.",
      "Store it on a mannequin head or stand on nights you remove it, to hold its shape.",
    ],
  },
  {
    slug: "mens-hairpieces",
    image: "/images/mens-hairpieces/1.jpg",
    galleryKicker: "The piece",
    galleryTitle: { lead: "Fitted to your", accent: "pattern." },
    gallery: [
      {
        src: "/images/mens-hairpieces/2.webp",
        alt: "Before and after a professionally fitted men's hairpiece",
      },
      {
        src: "/images/mens-hairpieces/3.avif",
        alt: "Highlighted men's hairpiece on models with top and base views",
      },
      {
        src: "/images/mens-hairpieces/4.jpg",
        alt: "Natural hairline on a men's hairpiece with lace base detail",
      },
    ],
    name: "Men's Hairpieces",
    primaryKeyword: "professional hair pieces for men",
    rationale: "1,000/mo search term. Distinct intent from 'system'.",
    whatItIs:
      "A hairpiece is a professionally fitted section of real human hair attached to cover thinning or bald areas, sized and shaped to your specific hair loss pattern.",
    metaDescription:
      "Custom men's hairpieces sized to your loss pattern. Real human hair, fitted and blended at our Orange County, CA studio.",
    whoItsFor:
      "Men researching options in a more general, less brand-specific way, often earlier in their research than someone searching a specific product name.",
    materials: ["Partial-coverage lace pieces", "Full-cap pieces", "Color-matched human hair", "Reusable adhesive systems"],
    comparison:
      "A hairpiece can mean a partial or full-coverage piece; we fit the exact size and shape your hair loss pattern calls for, not a one-size template.",
    overview: [
      "'Hairpiece' is a broad term, and that's the point of this page: whether you're picturing a small patch over a thinning spot or a larger section covering more of your scalp, a hairpiece is sized and shaped to the exact area you need covered.",
      "Rather than fitting you into a single template, we start from your hair loss pattern and build a piece scaled to it, partial coverage for early thinning, or a larger section for more advanced loss, using real human hair matched to your own.",
    ],
    benefits: [
      "Sized to your exact area of thinning or hair loss, partial or full coverage.",
      "Real human hair color-matched to blend with what you still have.",
      "Reusable adhesive systems designed for repeated, professional application.",
      "No commitment to a single fixed style; pieces can be adjusted as your needs change.",
      "A starting point if you're still researching your options.",
    ],
    signs: [
      "You're early in researching your options and not sure yet which specific product you need.",
      "You have a smaller area of thinning and don't need full-scalp coverage.",
      "You want a professionally fitted piece rather than a generic online purchase.",
      "You're comparing partial vs. full coverage before deciding what's right for you.",
    ],
    faqs: [
      {
        question: "What's the difference between a hairpiece and a full system?",
        answer:
          "A hairpiece can cover a partial area, just the crown or hairline, while a full system typically covers more of the scalp. We'll size it to your actual pattern of loss.",
      },
      {
        question: "Can a hairpiece be enough if I only have thinning, not full baldness?",
        answer:
          "Yes, a partial-coverage piece is often the right fit for early or localized thinning rather than a full-cap solution.",
      },
      {
        question: "How is a hairpiece attached to my scalp?",
        answer:
          "With a reusable, medical-grade adhesive applied and maintained at our studio, not a one-time or disposable method.",
      },
      {
        question: "Can I start with a hairpiece and move to a fuller system later?",
        answer:
          "Yes, many clients start with partial coverage and adjust as their needs or preferences change over time.",
      },
    ],
    relatedSearches: [
      "professional hair pieces for men",
      "mens hairpiece",
      "partial hair piece for men",
      "hairpiece for thinning hair",
      "human hair pieces for men",
    ],
    careTips: [
      "Keep the surrounding natural hair trimmed to blend cleanly at the edges of partial coverage.",
      "Reapply adhesive only to the perimeter, not the full base, to make future removal easier.",
      "Rotate between two adhesive types if you notice skin sensitivity with daily wear.",
      "Bring the piece in for resizing if your pattern of hair loss changes over time.",
    ],
  },
  {
    slug: "mens-hair-units",
    image: "/images/mens-hair-units/1.jpeg",
    galleryKicker: "Cut in",
    galleryTitle: { lead: "Barber blend.", accent: "Same-day unit." },
    gallery: [
      {
        src: "/images/mens-hair-units/2.jpg",
        alt: "Before and after a salt-and-pepper men's hair unit with the base shown",
      },
      {
        src: "/images/mens-hair-units/3.jpg",
        alt: "Before and after a men's hair unit with 360 waves and a skin fade",
      },
      {
        src: "/images/mens-hair-units/4.jpg",
        alt: "Before and after a curly men's hair unit blended into a fade",
      },
    ],
    name: "Men's Hair Units",
    primaryKeyword: "man unit hair",
    rationale: "Urban/barber vernacular term with real search volume.",
    whatItIs:
      "A hair unit is barber-shop vernacular for a full or partial hair system, cut in and blended by a stylist the same way a fresh haircut would be.",
    metaDescription:
      "Men's hair units cut and blended like a fresh haircut. Barbershop-style systems fitted at ManHair in Orange, California.",
    whoItsFor:
      "Men who found us through barber-shop word of mouth or searched using barbershop terminology rather than clinical language.",
    materials: ["Full lace units", "Skin-base units", "Barber cut-in and blend service", "Custom density matching"],
    comparison:
      "Functionally the same product as our other systems; we use 'unit' here because that's the word many clients bring in with them on day one.",
    overview: [
      "Barbers call it a 'unit,' and if that's the word you walked in with, you're in the right place. A hair unit is the same custom lace or skin-base system we build for every client, just cut in and blended the way a fresh haircut would be.",
      "We work with the same eye for line-ups and tapers a good barber uses: the unit is fitted first, then cut in and blended at the hairline and temples so it reads as a haircut, not an addition.",
    ],
    benefits: [
      "Cut in and blended the same way a barber would finish a fresh haircut.",
      "Full or partial lace and skin-base units to match your coverage needs.",
      "Custom density matching so the blend at the hairline looks natural.",
      "Built for clients who found us through barbershop word of mouth.",
      "The same real human hair and craftsmanship as our other systems.",
    ],
    signs: [
      "You heard about us from your barber or another client using the word 'unit.'",
      "You want the piece cut in and blended like a haircut, not just attached.",
      "You care about clean line-ups and tapers at the hairline and temples.",
      "You want a barbershop-style finish rather than a clinical fitting.",
    ],
    faqs: [
      {
        question: "What's a 'hair unit' compared to a hair system?",
        answer:
          "Same product; 'unit' is barbershop vernacular many clients use. We build and fit it the same way, then cut it in and blend it like a fresh haircut.",
      },
      {
        question: "Can my barber cut in my unit after I get it fitted?",
        answer:
          "We handle the initial cut-in and blend ourselves to guarantee the fit, but many clients then maintain their look with their regular barber between studio visits.",
      },
      {
        question: "Will the line-up and taper look like a real haircut?",
        answer:
          "Yes, that's exactly the goal: a natural line-up and taper at the hairline and temples so it reads as a haircut, not a piece.",
      },
      {
        question: "Do you offer full and partial units?",
        answer:
          "Yes, both full-lace and skin-base units are available depending on how much coverage you need.",
      },
    ],
    relatedSearches: [
      "man unit hair",
      "hair unit for men",
      "barber hair unit",
      "mens hair unit near me",
      "full lace unit",
    ],
    careTips: [
      "Ask your barber to line up the surrounding hair between studio visits to keep the blend sharp.",
      "Use a light, matte styling product; heavy gels can stiffen the taper and make the line-up look artificial.",
      "Space a fresh fade a few days apart from unit reattachment rather than doing both the same day.",
      "Wash with lukewarm water to protect both the blend and the bond.",
    ],
  },
  {
    slug: "mens-wigs",
    image: "/images/mens-wigs/1.webp",
    galleryKicker: "Full coverage",
    galleryTitle: { lead: "A complete cap.", accent: "Real human hair." },
    gallery: [
      {
        src: "/images/mens-wigs/2.jpg",
        alt: "Fitting a men's wig and bonding it to the scalp",
      },
      {
        src: "/images/mens-wigs/3.jpeg",
        alt: "Natural-looking afro-textured men's wig with lace base detail",
      },
      {
        src: "/images/mens-wigs/4.avif",
        alt: "Men's wig result with base detail and color options",
      },
    ],
    name: "Men's Wigs",
    primaryKeyword: "wigs for men",
    rationale: "Broadest term. Captures searchers who don't know the terminology yet.",
    whatItIs:
      "A men's wig is a full-coverage hair replacement, real human hair built on a breathable cap, for men who want complete coverage rather than a partial system.",
    metaDescription:
      "Full-coverage men's wigs in real human hair. Complete scalp coverage from ManHair's Orange, CA studio. Free virtual consult.",
    whoItsFor:
      "Men earliest in their research, often unfamiliar with the industry's other terms, or men who need full-head coverage rather than a partial piece.",
    materials: ["Full lace caps", "Machine-wefted caps", "100% real human hair", "Custom cap sizing"],
    comparison:
      "Unlike a partial system, a men's wig covers the entire head. We still build it from real human hair and fit it professionally, not off-the-shelf.",
    overview: [
      "If you're not sure yet what the right term even is for what you're picturing, 'wig' is usually where that search starts, and it's the right word for full-coverage hair replacement: a complete cap of real human hair rather than a partial system.",
      "We build every wig on a breathable cap, custom-sized to your head rather than a stock size, and finish it with 100% real human hair so it moves and wears like natural hair, not a costume piece.",
    ],
    benefits: [
      "Full-head coverage, ideal if you need more than a partial system.",
      "Breathable cap construction custom-sized to your head shape.",
      "100% real human hair, not synthetic fiber.",
      "Professionally fitted, not an off-the-shelf online purchase.",
      "A good starting point if you're still learning the terminology in this space.",
    ],
    signs: [
      "You need full coverage rather than a partial hairline or crown piece.",
      "You're new to researching hair replacement and 'wig' is the term you know.",
      "You want a breathable, comfortable cap for extended daily wear.",
      "You're looking for a professionally fitted alternative to an off-the-shelf wig.",
    ],
    faqs: [
      {
        question: "Are men's wigs different from women's wigs?",
        answer:
          "Yes, men's wigs are built with shorter, natural men's cuts and hairlines in mind, and fitted specifically to a man's head shape and hair pattern.",
      },
      {
        question: "Will a wig look natural, not like a costume piece?",
        answer:
          "With a breathable cap, real human hair, and a professional fitting, yes, it's built to be worn daily and hold up to close inspection.",
      },
      {
        question: "Do I need full baldness to get a wig, or does it work for partial loss?",
        answer:
          "A wig is best suited to more advanced or full-head coverage needs; for partial thinning, a hairpiece or system is usually a more precise fit.",
      },
      {
        question: "How is a wig different from a hair replacement system?",
        answer:
          "A wig covers the entire head; a system is built to blend with hair you still have. We'll help you figure out which fits your actual pattern of loss.",
      },
    ],
    relatedSearches: [
      "wigs for men",
      "mens wig near me",
      "human hair wig for men",
      "full coverage hair replacement",
      "mens wig fitting",
    ],
    careTips: [
      "Wash the full cap every one to two weeks with a wig-safe shampoo instead of daily washing.",
      "Air-dry on a stand rather than a towel to preserve the cap's shape.",
      "Rotate between two wigs if worn daily, to extend the life of each.",
      "Have the cap professionally refitted if you notice looseness at the temples.",
    ],
  },
  {
    slug: "non-surgical-hair-replacement",
    image: "/images/non-surgical-hair-replacement/1.webp",
    galleryKicker: "Real results",
    galleryTitle: { lead: "No surgery.", accent: "Same-day coverage." },
    gallery: [
      {
        src: "/images/non-surgical-hair-replacement/2.jpg",
        alt: "Before and after non-surgical hair replacement with hair system",
      },
      {
        src: "/images/non-surgical-hair-replacement/3.jpeg",
        alt: "Checking a natural hairline after non-surgical replacement",
      },
      {
        src: "/images/non-surgical-hair-replacement/4.jpg",
        alt: "Crown coverage before and after non-surgical hair replacement",
      },
    ],
    name: "Non-Surgical Hair Replacement",
    primaryKeyword: "non surgical hair replacement",
    rationale: "Category-defining term. Key comparison-stage entry point vs. transplants.",
    whatItIs:
      "Non-surgical hair replacement restores a full, natural hairline with zero procedures, zero downtime, and zero scalpel, using a custom-fitted hair system instead of grafts.",
    metaDescription:
      "Non-surgical hair replacement for men in Orange County, CA. Instant hairline, no downtime, and a free virtual consultation.",
    whoItsFor:
      "Men actively comparing this approach against a hair transplant, and men who want a result visible the same day rather than waiting months to grow in.",
    materials: ["Lace, skin, or mono base", "Real human hair", "No incisions, no grafts, no anesthesia"],
    comparison:
      "Unlike a transplant, there's no surgery, no recovery period, and no risk of graft failure. Results are visible immediately and are fully reversible.",
    overview: [
      "If you're comparing a hair transplant against other options, this is the category to understand: non-surgical hair replacement gets you a full, natural hairline using a custom-fitted system instead of grafts, with results visible the same day instead of months of regrowth.",
      "There's no incision, no anesthesia, and no risk of graft failure. Instead, we build a base, lace, skin, or mono, and real human hair matched to your own, then fit and attach it at our Orange, CA studio.",
    ],
    benefits: [
      "Results visible immediately, not after months of waiting for grafts to grow in.",
      "No incisions, no anesthesia, and no surgical risk.",
      "No risk of graft failure or patchy regrowth.",
      "Fully reversible, nothing is permanently altered about your scalp.",
      "A fraction of the recovery time of a transplant procedure.",
    ],
    signs: [
      "You're actively comparing a hair transplant against non-surgical options.",
      "You want to avoid surgery, anesthesia, or a multi-month recovery.",
      "You want to see your result the same day, not wait for grafts to grow in.",
      "You want a reversible option rather than a permanent surgical procedure.",
    ],
    faqs: [
      {
        question: "Is non-surgical hair replacement as effective as a transplant?",
        answer:
          "They solve the same problem differently. A transplant relocates your own follicles and takes months to show results; non-surgical replacement gives a full, natural look immediately with no surgical risk.",
      },
      {
        question: "Is there any downtime after getting a non-surgical system?",
        answer:
          "None. You leave your fitting with a finished result; there's no incision or recovery period to plan around.",
      },
      {
        question: "Can I switch to a transplant later if I choose non-surgical first?",
        answer:
          "Yes, non-surgical replacement doesn't affect your scalp or existing follicles, so it doesn't rule out surgical options later if you ever want them.",
      },
      {
        question: "Is non-surgical hair replacement permanent?",
        answer:
          "It's a long-term but reversible solution. The system itself is maintained and replaced over time rather than being a one-time permanent procedure.",
      },
    ],
    relatedSearches: [
      "non surgical hair replacement",
      "non surgical hair replacement near me",
      "alternative to hair transplant",
      "non surgical hair system",
      "hair replacement without surgery",
    ],
    careTips: [
      "Follow the same aftercare as any bonded system: gentle cleansing, no high heat directly on the bond.",
      "Keep your reattachment schedule consistent; missed visits are the top cause of early edge lifting.",
      "Avoid switching adhesive types without consulting your stylist first.",
      "Protect the hairline from prolonged direct sun exposure to prevent premature color fading.",
    ],
  },
  {
    slug: "hair-system-maintenance",
    image: "/images/hair-system-maintenance/1.jpeg",
    galleryKicker: "In the studio",
    galleryTitle: { lead: "Reattachment, cleaning,", accent: "and care." },
    gallery: [
      {
        src: "/images/hair-system-maintenance/2.jpg",
        alt: "Before and after hair system reattachment",
      },
      {
        src: "/images/hair-system-maintenance/3.jpg",
        alt: "Daily brushing and hair system maintenance",
      },
      {
        src: "/images/hair-system-maintenance/4.jpg",
        alt: "Hair system base cleaned for reattachment",
      },
    ],
    name: "Hair System Maintenance & Reattachment",
    primaryKeyword: "hair system maintenance near me",
    rationale: "Retention and competitor-switching traffic. High lifetime value.",
    whatItIs:
      "Ongoing maintenance keeps an existing hair system, from us or from another provider, looking fresh: reattachment, cleaning, density touch-ups, and cut-ins on a regular schedule.",
    metaDescription:
      "Hair system maintenance in Orange, CA: reattachment, cleaning, and cut-ins to keep your unit looking like day one again.",
    whoItsFor:
      "Existing hair system wearers (ours or a competitor's) whose system needs reattachment, cleaning, or a switch to a new provider.",
    materials: ["Reattachment & bonding service", "Deep cleaning", "Cut-in & blend touch-ups", "Provider-switch onboarding"],
    comparison:
      "This is the retention service behind every other page on this list: once you have a system, this is how it keeps looking like day one.",
    overview: [
      "Owning a hair system is only half the job, keeping it looking like day one is the other half. Regular maintenance, reattachment, cleaning, and cut-in touch-ups, is what keeps the hairline tight and the hair itself looking fresh between fittings.",
      "We also service systems built elsewhere. If you're switching providers, bring your current piece in for reattachment and cleaning on our regular schedule; to guarantee quality we don't cut or alter systems we didn't build, but we'll keep an existing one looking its best.",
    ],
    benefits: [
      "Reattachment and bonding to keep your system secure between visits.",
      "Deep cleaning to remove buildup and keep the hair looking fresh.",
      "Cut-in and blend touch-ups as your natural hair grows.",
      "Reattachment and cleaning for systems from other providers.",
      "A set schedule so you're never guessing when it's time to come in.",
    ],
    signs: [
      "Your system's edges are lifting or it's due for reattachment.",
      "You're switching from another provider and need your current piece serviced.",
      "It's been more than six weeks since your last maintenance visit.",
      "You want a regular schedule instead of waiting until there's a problem.",
    ],
    faqs: [
      {
        question: "How often do I need a maintenance session?",
        answer:
          "Most clients come in every four to six weeks for reattachment and cleaning, though it depends on how active your lifestyle is.",
      },
      {
        question: "Can you maintain a system I got from another provider?",
        answer:
          "Yes, we provide reattachment and cleaning for systems from other providers. To guarantee quality and fit, we don't cut or alter pieces we didn't build ourselves.",
      },
      {
        question: "What happens during a maintenance visit?",
        answer:
          "We remove and clean the system, reapply fresh bonding, and do any needed cut-in or blend touch-ups so it sits naturally against your regrown hair.",
      },
      {
        question: "If I switch providers, do I need a whole new system?",
        answer:
          "Not necessarily. Bring in your current piece first; often it just needs proper reattachment and cleaning rather than a full replacement.",
      },
    ],
    relatedSearches: [
      "hair system maintenance near me",
      "hair system reattachment",
      "hair system cleaning",
      "hair unit maintenance",
      "hair system upkeep",
    ],
    careTips: [
      "Bring your system in as soon as you notice lifting rather than waiting for the next scheduled visit.",
      "Avoid DIY reattachment products between visits; they can damage the base and complicate professional bonding.",
      "If switching providers, bring your current piece in as-is so we can assess it before cleaning or reattaching.",
      "Note any product sensitivities so we can adjust adhesives at your next visit.",
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function servicePath(slug: string): string {
  return slug === "mens-hair-replacement-systems"
    ? "/mens-hair-replacement-systems/"
    : `/services/${slug}/`;
}
