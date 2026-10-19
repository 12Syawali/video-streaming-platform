import Common "common";

module {
  public type UserId = Common.UserId;

  // A purchasable coin pack. `priceInCents` is the Stripe charge in the
  // smallest currency unit (USD cents); `coins` is the amount credited.
  public type CoinPack = {
    id : Text;
    name : Text;
    description : Text;
    coins : Nat;
    priceInCents : Nat;
    currency : Text;
  };

  // A completed checkout that has already been credited, keyed by session id
  // so a repeated status poll cannot credit the same purchase twice.
  public type CreditedSession = {
    sessionId : Text;
    owner : UserId;
    coins : Nat;
  };
};
