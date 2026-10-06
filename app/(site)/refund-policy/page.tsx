import type { Metadata } from "next";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { Display } from "@/components/ui";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

const PAGE = getPageMeta("/refund-policy/")!;
export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

// Verbatim body copy captured from the live WordPress page
// (.scratch/page-data/content/refund-policy.json — mainHtml).
// Do not reword; only the surrounding layout is restyled.
const BODY_HTML = `
<p><strong>Refund Policy for stock items:</strong></p>
<p>Returns<br>
Our policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately we can’t offer you a refund or exchange.</p>
<p>To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.</p>
<p>Please do not send your purchase back to the manufacturer.</p>
<p>There are certain situations where only partial refunds are granted (if applicable)<br>
Any item that is returned more than 30 days after delivery</p>
<p>Refunds (if applicable)<br>
Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.<br>
If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.</p>
<p>Late or missing refunds (if applicable)<br>
If you haven’t received a refund yet, first check your bank account again.<br>
Then contact your credit card company, it may take some time before your refund is officially posted.<br>
Next contact your bank. There is often some processing time before a refund is posted.<br>
If you’ve done all of this and you still have not received your refund yet, please contact us at info@manhaironline.com.</p>
<p>Sale items (if applicable)<br>
Only regular priced items may be refunded, unfortunately sale items cannot be refunded.</p>
<p>Exchanges (if applicable)<br>
We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at info@manhaironline.com and send your item to: MANHAIR, Orange County, CA</p>
<p>Gifts<br>
If the item was marked as a gift when purchased and shipped directly to you, you’ll receive a gift credit for the value of your return. Once the returned item is received, a gift certificate will be mailed to you.</p>
<p>If the item wasn’t marked as a gift when purchased, or the gift giver had the order shipped to themselves to give to you later, we will send a refund to the gift giver and he will find out about your return.</p>
<p>Shipping<br>
To return your product, you should mail your product to: MANHAIR, Orange County, CA</p>
<p>You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.</p>
<p>Depending on where you live, the time it may take for your exchanged product to reach you, may vary.</p>
<p>If you are shipping an item over $75, you should consider using a trackable shipping service or purchasing shipping insurance. We don’t guarantee that we will receive your returned item.</p>
<p><strong>Refund Policy for CUSTOM ORDER items:</strong></p>
<p><strong>SECTION 1 –&nbsp;CANCELLATION</strong></p>
<p>1 If, for any reason, you wish to do so you have the right to cancel any order you have placed. You may cancel them up to 14 working days, starting from the date in which you placed your order.</p>
<p>2 If your order has entered the production stage during the first 14 working days after placing your order, 50% of total order price will now become non-refundable.</p>
<p>3 For instructions on how to return an order, please see section #8 below.</p>
<p><strong>SECTION 2 – RETURNS</strong></p>
<p>Your Statutory Right To Cancel Your Order<br>
1 You have the legal right to cancel your order within 14 working days of receiving your order. Due to the nature of our customized goods, 50% of the total cost of the goods is non-refundable. Should you wish to return our goods within the 14 day period, we will happy to refund 50%, or where possible work with you to provide an alternative solution.<br>
2 In order for the items to be partial refunded or exchanged the goods must be returned within the 14 day period, received in an unworn, unused condition. We are not obliged to provide refunds on any items returned to us without packaging, damaged packaging, returned in un-cared for condition. We may return the goods back to you.<br>
3 The goods are your responsibility until they reach us. You will be liable to pay the cost of returning unwanted goods back to us unless the item has a manufacturing defect or received in error. For your protection we recommend you use a postal service that insures you for the value of the goods you are returning.</p>
<p><strong>Our returns address is:</strong></p>
<p>MANHAIR, Orange County, CA</p>
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
      { name: "Refund Policy" },
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
    <CMSRoute path={"/refund-policy/"}>
    <>
      <JsonLd data={graph} />

      {/* Hero */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)]">
        <div className="mh-container py-10 md:py-24">
          <p className="mh-eyebrow">Legal</p>
          <Display as={1} size="lg" className="mt-6 max-w-3xl">
            Refund Policy
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
