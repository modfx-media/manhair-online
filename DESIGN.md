# ManHair membership pages

Public membership and join pages use the existing studio identity. They are not a separate product theme.

## Type and color

- Body: Manrope, already loaded as `--font-sans`.
- Display: Outfit, already loaded as `--font-display` through `.mh-display`.
- Canvas `#FAF7F1`, secondary surface `#F5EFE3`, ink `#1A130E` and `#2A211A`.
- Accent copper `#C9A24A`. Primary buttons keep the site’s red-to-copper control.
- Prices use tabular figures. Body measure stays near 65 characters. Inputs stay at least 16px.

## Hierarchy

- One primary action on the membership page: “Start with Signature”. The same label repeats after the comparison.
- Each tier has its own selector: “Select Essential”, “Select Signature”, or “Select Elite”.
- Signature is the default when join is opened without a tier. The card says “Default”. It does not say the plan is the most popular.
- Join is the review. The submit label is “Continue to secure checkout”. On this preview that control stays disabled because payments are not connected.

## Facts on the page

- $495 is due today and is credited toward the first system.
- $449, $559, and $669 are the monthly amounts, first charged 30 days later, then each calendar month.
- 13 visits a year, about every 4 weeks. That cadence is not the billing month.
- Essential is 4 hair systems and 9 maintenance visits. Signature is 6 and 7. Elite is 8 and 5, and only Elite includes priority booking. Each pair adds to 13 scheduled visits. The packages page and the join review both read `packageFact()`.
- A hair system is a counted custom system. A maintenance visit is a studio visit that is not a new system. The page does not describe cut, color, adhesive, materials, or a replacement calendar.
- Twelve monthly charges may be shown as $5,388, $6,708, and $8,028. That line excludes the $495 setup and is not an annual prepay.
- An additional fitted system is $849 and an extra maintenance visit is $225. Checkout does not sell them.
- First system lead time is 8–12 weeks. Billing can start before the fitting.
- Minimum term is 3 months, then month to month. The joined rate locks for 24 months. Cancellation during the minimum is scheduled for the end of the minimum and adds no fee.
- Founding pricing is off and is not offered.
- No sales tax is added at this checkout. Charges show as MODFXMEDIA, LLC.
- Studio scheduling is not connected. The consultation request does not book a time.
- A checkout return does not mean the payment succeeded. Only a verified processor event does.

## Phone and motion

- The plan picker is a three-part radio group. All three plans stay on the page. Nothing is hidden behind a swipe.
- A single bottom bar on small screens continues with the selected plan. The page keeps space beneath the last section so the bar does not cover it. Desktop does not use that bar.
- Prices and terms are painted in their final state. They do not fade in.
- A 2px copper line tracks scroll with `transform: scaleX` only. Pressed actions scale to 0.96 for 150ms.
- `prefers-reduced-motion: reduce` hides that line and the picker jumps instead of smooth-scrolling.
- The words and prices are in the server HTML. Motion is not required to read or choose a plan.

## Motion and targets

- No entrance animation on these pages. Existing button color transitions stay.
- Controls used to choose or continue are at least 44px tall.
- Preview deployments show a review banner. They are not the live site and cannot take a real charge.
