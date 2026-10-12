import type { Metadata } from "next";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { Display } from "@/components/ui";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

const PAGE = getPageMeta("/privacy-policy/")!;
export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

// Verbatim body copy captured from the live WordPress page
// (.scratch/page-data/content/privacy-policy.json — mainHtml).
// Do not reword; only the surrounding layout is restyled.
const BODY_HTML = `
<p>Privacy Statement</p>
<p><strong>SECTION 1 – WHAT DO WE DO WITH YOUR INFORMATION?</strong></p>
<p>When you purchase something from our store, as part of the buying and selling process, we collect the personal information you give us such as your name, address and email address.<br>
When you browse our store, we also automatically receive your computer’s internet protocol (IP) address in order to provide us with information that helps us learn about your browser and operating system.<br>
Email marketing (if applicable): With your permission, we may send you emails about our store, new products and other updates.</p>
<p><strong>SECTION 2 – CONSENT</strong></p>
<p>How do you get my consent?<br>
When you provide us with personal information to complete a transaction, verify your credit card, place an order, arrange for a delivery or return a purchase, we imply that you consent to our collecting it and using it for that specific reason only.<br>
If we ask for your personal information for a secondary reason, like marketing, we will either ask you directly for your expressed consent, or provide you with an opportunity to say no.</p>
<p>How do I withdraw my consent?<br>
If after you opt-in, you change your mind, you may withdraw your consent for us to contact you, for the continued collection, use or disclosure of your information, at anytime, by contacting us at info@manhaironline.com</p>
<p><strong>SECTION 3 –&nbsp;TERMS OF SALE</strong></p>
<p>1 These terms apply to goods ordered via the internet and over the phone. By placing an order you are offering to purchase a product on and subject to the following terms and conditions.<br>
2 Production times may vary according to current order volumes and any guarantees or representations made as to delivery times are subject to any delays resulting from postal delays/errors or force majeure for which we will not be responsible.<br>
3 In order to contract with ManHair&nbsp;you must possess a valid credit or debit card issued by a bank acceptable to us.<br>
4 We take payment from your card when we process your order and have checked your card details. Goods are subject to bespoke customization and a exact turnaround time may vary depending on current production levels</p>
<p><strong>SECTION 4 – PRICING &amp; AVAILABILITY</strong></p>
<p>1 You will be charged the current price for buying goods from our website at the date you place your order. All prices are displayed on our Website.&nbsp; We reserve the right to amend prices at any time.<br>
2 Any orders cancelled within 14 days are eligible for a full refund, as long as it has not entered production stage.</p>
<p>3 Due to the nature of our custom made to order goods, 50% (often referred to as ‘deposit’) of all orders are non refundable once it has reached production stage.</p>
<p><strong>SECTION 5 – PAYMENTS</strong></p>
<p>1 When you place your order, you have the option to pay 50% deposit. The remaining balance will need to be paid in full 48 hours before shipment. If full and final settlement is not made we not dispatch goods and you will not be eligible for a refund.<br>
2 If you have placed an order and paid in full, we are unable to refund any part unless you are cancelling your order. In this event, it would follow our standard cancellation terms.</p>
<p><strong>SECTION 6 – DELIVERY</strong></p>
<p>1 We deliver to any address&nbsp;WORLDWIDE. Where possible we are able to supply a valid tracking number. We will not be liable for lost or delayed shipments caused by the courier or postal service. Any upgraded shipping requests are dealt with on a case by case basis. We reserve the right to pass on any additional shipping costs to you.<br>
2 Orders may require a signature to acknowledge delivery. The signature of the person accepting delivery at the delivery address will be proof that delivery has been received by you or the person, to whom the order is addressed. If no one is available to accept the delivery, where possible you should receive a card to advise that a delivery has been attempted.</p>
<p><strong>SECTION 7 –&nbsp;CANCELLATION</strong></p>
<p>1 If, for any reason, you wish to do so you have the right to cancel any order you have placed. You may cancel them up to 14 working days, starting from the date in which you placed your order.</p>
<p>2 If your order has entered the production stage during the first 14 working days after placing your order, 50% of total order price will now become non-refundable.</p>
<p>3 For instructions on how to return an order, please see section #8 below.</p>
<p><strong>SECTION 8 – RETURNS</strong></p>
<p>Your Statutory Right To Cancel Your Order<br>
1 You have the legal right to cancel your order within 14 working days of receiving your order. Due to the nature of our customized goods, 50% of the total cost of the goods is non-refundable. Should you wish to return our goods within the 14 day period, we will happy to refund 50%, or where possible work with you to provide an alternative solution.<br>
2 In order for the items to be partial refunded or exchanged the goods must be returned within the 14 day period, received in an unworn, unused condition. We are not obliged to provide refunds on any items returned to us without packaging, damaged packaging, returned in un-cared for condition. We may return the goods back to you.<br>
3 The goods are your responsibility until they reach us. You will be liable to pay the cost of returning unwanted goods back to us unless the item has a manufacturing defect or received in error. For your protection we recommend you use a postal service that insures you for the value of the goods you are returning.</p>
<p><strong>Our returns address is:</strong></p>
<p>ManHair, Orange County, CA</p>
<p><strong>SECTION 9 – DISCLOSURE</strong></p>
<p>We may disclose your personal information if we are required by law to do so or if you violate our Terms of Service.</p>
<p><strong>SECTION 11 – SECURITY</strong></p>
<p>To protect your personal information, we take reasonable precautions and follow industry best practices to make sure it is not inappropriately lost, misused, accessed, disclosed, altered or destroyed.<br>
If you provide us with your credit card information, the information is encrypted using secure socket layer technology (SSL) and stored with a AES-256 encryption. Although no method of transmission over the Internet or electronic storage is 100% secure, we follow all PCI-DSS requirements and implement additional generally accepted industry standards.</p>
<p><strong>SECTION 12 – AGE OF CONSENT</strong></p>
<p>By using this site, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority in your state or province of residence and you have given us your consent to allow any of your minor dependents to use this site.</p>
<p><strong>SECTION 13 – CHANGES TO THIS PRIVACY POLICY</strong></p>
<p>We reserve the right to modify this privacy policy at any time, so please review it frequently. Changes and clarifications will take effect immediately upon their posting on the website. If we make material changes to this policy, we will notify you here that it has been updated, so that you are aware of what information we collect, how we use it, and under what circumstances, if any, we use and/or disclose it.<br>
If our store is acquired or merged with another company, your information may be transferred to the new owners so that we may continue to sell products to you.</p>
<p><strong>QUESTIONS AND CONTACT INFORMATION</strong></p>
<p>If you would like to: access, correct, amend or delete any personal information we have about you, register a complaint, or simply want more information contact our Privacy Compliance Officer at info@manhaironline.com</p>
`;

export default function Page() {
  const graph = buildPageGraph({
    origin: SITE.origin,
    path: PAGE.path,
    title: PAGE.title,
    description: PAGE.description,
    image: PAGE.og.image,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Privacy Policy" },
    ],
    organization: {
      name: SITE.orgName,
      url: `${SITE.origin}/`,
      logo: {
        url: `${SITE.origin}${SITE.logo.url}`,
        width: SITE.logo.width,
        height: SITE.logo.height,
        caption: SITE.logo.caption,
      },
      sameAs: SOCIAL.map((s) => s.href),
    },
    siteName: SITE.siteName,
    siteDescription: SITE.tagline,
  });

  return (
    <CMSRoute path={"/privacy-policy/"}>
    <>
      <JsonLd data={graph} />

      {/* Hero */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)]">
        <div className="mh-container py-10 md:py-24">
          <p className="mh-eyebrow">Legal</p>
          <Display as={1} size="lg" className="mt-6 max-w-3xl">
            Privacy Policy
          </Display>
          <span className="mh-rule mt-8" aria-hidden="true" />
        </div>
      </section>

      {/* Body */}
      <section className="bg-[color:var(--mh-bg)]">
        <div className="mh-container py-8 md:py-20">
          <article
            className="mh-prose mx-auto max-w-3xl"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: BODY_HTML }}
          />
        </div>
      </section>
    </>
  </CMSRoute>
  );
}
