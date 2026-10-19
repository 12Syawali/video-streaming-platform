import Map "mo:core/Map";
import Types "../types/profiles";
import Common "../types/common";
import ProfilesLib "../lib/profiles";

mixin (
  profiles : Map.Map<Common.UserId, Types.Profile>,
  follows : Map.Map<Common.UserId, Map.Map<Common.UserId, Bool>>,
) {
  public query ({ caller }) func getMyProfile() : async Types.ProfileView {
    switch (ProfilesLib.getProfile(profiles, caller)) {
      case (?p) { p };
      case null {
        {
          owner = caller;
          displayName = "";
          avatar = null;
          followerCount = 0;
          followingCount = 0;
          coinBalance = 0;
        };
      };
    };
  };

  public query func getProfile(user : Common.UserId) : async ?Types.ProfileView {
    ProfilesLib.getProfile(profiles, user);
  };

  public shared ({ caller }) func updateMyProfile(displayName : Text, avatar : ?Common.FileRef) : async Types.ProfileView {
    ProfilesLib.updateProfile(profiles, caller, displayName, avatar);
  };

  public shared ({ caller }) func toggleFollow(creator : Common.UserId) : async Bool {
    ProfilesLib.toggleFollow(profiles, follows, caller, creator);
  };

  public query ({ caller }) func isFollowing(creator : Common.UserId) : async Bool {
    ProfilesLib.isFollowing(follows, caller, creator);
  };
};
