/**
 * Preview setup runs in the preview function, not during the build.
 * The sensitive test key is not present in the build environment, so a build
 * must not write public/stripe-sandbox-setup.json.
 */
console.log(
  JSON.stringify({
    scope: "stripe_sandbox_setup",
    phase: "build",
    run: false,
    reason: "runtime_only",
  }),
);
