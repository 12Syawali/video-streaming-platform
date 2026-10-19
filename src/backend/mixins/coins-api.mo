import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Stripe "mo:caffeineai-stripe/stripe";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/coins";
import ProfileTypes "../types/profiles";
import Common "../types/common";
import CoinsLib "../lib/coins";
import EngagementLib "../lib/engagement";

mixin (
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
  credited : Map.Map<Text, Types.CreditedSession>,
  stripeState : Stripe.StripeState,
  transform : OutCall.Transform,
) {
  // The fixed catalogue of coin packs available for purchase.
  public query func listCoinPacks() : async [Types.CoinPack] {
    CoinsLib.listPacks();
  };

  // Start a Stripe checkout session for a coin pack. Returns the raw Stripe
  // session JSON (including the redirect `url`). Coins are NOT credited here;
  // the caller must poll `confirmCoinPurchase` after paying.
  public shared ({ caller }) func createCoinCheckout(packId : Text, successUrl : Text, cancelUrl : Text) : async Text {
    let configuration = switch (stripeState.configuration) {
      case (?c) { c };
      case null { Runtime.trap("Stripe is not configured") };
    };
    let pack = CoinsLib.getPack(packId) ?? Runtime.trap("Unknown coin pack");
    let items : [Stripe.ShoppingItem] = [
      {
        currency = pack.currency;
        productName = pack.name;
        productDescription = pack.description;
        priceInCents = pack.priceInCents;
        quantity = 1;
      },
    ];
    await Stripe.createCheckoutSession(configuration, caller, items, successUrl, cancelUrl, transform);
  };

  // Check a checkout session and credit the caller's coin balance exactly once
  // when the payment has completed. Returns the caller's current balance.
  public shared ({ caller }) func confirmCoinPurchase(sessionId : Text, packId : Text) : async Nat {
    let configuration = switch (stripeState.configuration) {
      case (?c) { c };
      case null { Runtime.trap("Stripe is not configured") };
    };
    if (CoinsLib.isSessionCredited(credited, sessionId)) {
      return EngagementLib.getCoinBalance(profiles, caller);
    };
    let status = await Stripe.getSessionStatus(configuration, sessionId, transform);
    switch (status) {
      case (#completed({ response })) {
        // The Stripe module reports #completed for any non-error reply, so
        // verify the session was actually paid before crediting coins.
        if (not response.contains(#text "\"payment_status\":\"paid\"")) {
          Runtime.trap("Payment did not complete");
        };
        let pack = CoinsLib.getPack(packId) ?? Runtime.trap("Unknown coin pack");
        CoinsLib.markSessionCredited(credited, sessionId, caller, pack.coins);
        EngagementLib.creditCoins(profiles, caller, pack.coins);
      };
      case (#failed(_)) {
        Runtime.trap("Payment did not complete");
      };
    };
  };
};
