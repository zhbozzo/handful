/**
 * Handful only schedules local notifications (the "Delivered ✓" update), so it doesn't need the
 * Push Notifications capability that expo-notifications adds by default. Dropping it lets anyone —
 * judges included — install the app on a real iPhone with a free Apple ID (personal teams can't sign
 * apps with push entitlements).
 */
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};
