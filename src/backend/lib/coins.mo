import Map "mo:core/Map";
import Text "mo:core/Text";
import Types "../types/coins";

module {
  // The fixed catalogue of coin packs offered for purchase. Prices are in USD
  // cents; the credited coin amount is the pack's `coins` value.
  public func listPacks() : [Types.CoinPack] {
    [
      {
        id = "starter";
        name = "Starter Pack";
        description = "A small boost of coins to get started.";
        coins = 100;
        priceInCents = 199;
        currency = "usd";
      },
      {
        id = "creator";
        name = "Creator Pack";
        description = "A popular pack for regular viewers.";
        coins = 550;
        priceInCents = 999;
        currency = "usd";
      },
      {
        id = "studio";
        name = "Studio Pack";
        description = "The best value for heavy viewers.";
        coins = 1200;
        priceInCents = 1999;
        currency = "usd";
      },
    ];
  };

  public func getPack(packId : Text) : ?Types.CoinPack {
    listPacks().find(func(p) = p.id == packId);
  };

  // True when this checkout session has already been credited to any user.
  public func isSessionCredited(
    credited : Map.Map<Text, Types.CreditedSession>,
    sessionId : Text,
  ) : Bool {
    switch (credited.get(sessionId)) {
      case (?_) { true };
      case null { false };
    };
  };

  public func markSessionCredited(
    credited : Map.Map<Text, Types.CreditedSession>,
    sessionId : Text,
    owner : Types.UserId,
    coins : Nat,
  ) : () {
    credited.add(sessionId, { sessionId; owner; coins });
  };
};
