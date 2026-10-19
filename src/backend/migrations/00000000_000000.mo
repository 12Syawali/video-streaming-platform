import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";

module {
  public type OldActor = {};

  type StripeConfiguration = {
    secretKey : Text;
    allowedCountries : [Text];
  };

  type StripeState = {
    var configuration : ?StripeConfiguration;
  };

  type CreditedSession = {
    sessionId : Text;
    owner : Principal;
    coins : Nat;
  };

  public type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    videos : Map.Map<Nat, {
      id : Nat;
      owner : Principal;
      title : Text;
      description : Text;
      videoFile : Text;
      thumbnail : Text;
      viewCount : Nat;
      likeCount : Nat;
      createdAt : Int;
      category : { #game; #entertainment };
    }>;
    profiles : Map.Map<Principal, {
      owner : Principal;
      displayName : Text;
      avatar : ?Text;
      followerCount : Nat;
      followingCount : Nat;
      coinBalance : Nat;
    }>;
    likes : Map.Map<Nat, Map.Map<Principal, Bool>>;
    saves : Map.Map<Principal, Map.Map<Nat, Bool>>;
    follows : Map.Map<Principal, Map.Map<Principal, Bool>>;
    state : { var nextVideoId : Nat };
    credited : Map.Map<Text, CreditedSession>;
    stripeState : StripeState;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      videos = Map.empty();
      profiles = Map.empty();
      likes = Map.empty();
      saves = Map.empty();
      follows = Map.empty();
      state = { var nextVideoId = 0 };
      credited = Map.empty();
      stripeState = { var configuration = null };
    };
  };
};
