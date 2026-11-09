import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { EXTRA_MAINTENANCE_CENTS, EXTRA_SYSTEM_CENTS, SETUP_CENTS } from "../../lib/membership/offer";
import { packageFacts, SHARED_PACKAGE, SYSTEM_VS_MAINTENANCE } from "../../lib/membership/packages";

test("package facts are the locked mix and do not invent a popularity claim", () => {
  const facts = packageFacts();
  assert.deepEqual(
    facts.map((fact) => [fact.name, fact.monthlyCents, fact.systems, fact.maintenance, fact.priorityBooking, fact.isDefault]),
    [
      ["Essential", 44900, 4, 9, false, false],
      ["Signature", 55900, 6, 7, false, true],
      ["Elite", 66900, 8, 5, true, false],
    ],
  );
  assert.deepEqual(
    facts.map((fact) => fact.annualMonthlyChargesCents),
    [538800, 670800, 802800],
  );
  for (const fact of facts) {
    assert.equal(fact.systems + fact.maintenance, 13);
    assert.equal(fact.visits, 13);
    assert.equal(fact.annualMonthlyChargesCents, fact.monthlyCents * 12);
    assert.match(fact.sumLabel, /13 scheduled studio visits/);
    assert.equal(fact.whyChoose.length, 2);
    assert.doesNotMatch(`${fact.difference} ${fact.choiceHeadline} ${fact.whyChoose.join(" ")} ${fact.bestFor} ${fact.annualNote} ${fact.mixLabel}`, /most popular|most guys|french lace|unlimited|warranty|prepay|athlete|swimmer|first-timer|lifespan|durability|standard of care|fitting scheduled/i);
  }
  assert.deepEqual(facts.map((fact) => fact.selectLabel), ["Choose Essential", "Choose Signature", "Choose Elite"]);
  assert.match(facts[2]!.whyChoose.join(" "), /not a booking link/);
  assert.doesNotMatch(facts[0]!.whyChoose.join(" ") + facts[1]!.whyChoose.join(" "), /not a booking link/);
  assert.match(facts[2]!.difference, /only priority booking/);
  assert.doesNotMatch(facts[0]!.difference, /priority booking is included/i);
  assert.equal(SHARED_PACKAGE.setupCents, 49500);
  assert.equal(SETUP_CENTS, 49500);
  assert.equal(EXTRA_SYSTEM_CENTS, 84900);
  assert.equal(EXTRA_MAINTENANCE_CENTS, 22500);
  assert.match(SYSTEM_VS_MAINTENANCE, /not 13 maintenance visits plus extra systems/);
});

test("membership and join pages render the shared package facts", () => {
  const memberships = readFileSync("app/(site)/memberships/page.tsx", "utf8");
  const join = readFileSync("app/(site)/join/page.tsx", "utf8");
  const studio = readFileSync("components/membership/PlanStudio.tsx", "utf8");
  assert.match(memberships, /packageFacts\(/);
  assert.match(memberships, /PlanStudio/);
  assert.match(studio, /\/join\/\?tier=\$\{plan\.id\}/);
  assert.match(studio, /prefers-reduced-motion: reduce/);
  assert.match(join, /PackageReview/);
  assert.doesNotMatch(memberships + join + studio, /Most guys|French lace|most popular|athlete|swimmer/);
});
