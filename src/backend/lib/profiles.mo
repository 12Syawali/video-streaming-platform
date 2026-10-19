import Map "mo:core/Map";
import Types "../types/profiles";
import Common "../types/common";

module {
  public func toView(profile : Types.Profile) : Types.ProfileView {
    {
      owner = profile.owner;
      displayName = profile.displayName;
      avatar = profile.avatar;
      followerCount = profile.followerCount;
      followingCount = profile.followingCount;
      coinBalance = profile.coinBalance;
    };
  };

  public func getProfile(profiles : Map.Map<Common.UserId, Types.Profile>, user : Common.UserId) : ?Types.ProfileView {
    switch (profiles.get(user)) {
      case (?p) { ?toView(p) };
      case null { null };
    };
  };

  public func getOrCreateProfile(profiles : Map.Map<Common.UserId, Types.Profile>, user : Common.UserId) : Types.ProfileView {
    switch (profiles.get(user)) {
      case (?p) { toView(p) };
      case null {
        let profile : Types.Profile = {
          owner = user;
          displayName = "";
          avatar = null;
          followerCount = 0;
          followingCount = 0;
          coinBalance = 0;
        };
        profiles.add(user, profile);
        toView(profile);
      };
    };
  };

  public func updateProfile(
    profiles : Map.Map<Common.UserId, Types.Profile>,
    user : Common.UserId,
    displayName : Text,
    avatar : ?Common.FileRef,
  ) : Types.ProfileView {
    let current = switch (profiles.get(user)) {
      case (?p) { p };
      case null {
        {
          owner = user;
          displayName = "";
          avatar = null;
          followerCount = 0;
          followingCount = 0;
          coinBalance = 0;
        };
      };
    };
    let updated : Types.Profile = {
      owner = current.owner;
      displayName = displayName;
      avatar = avatar;
      followerCount = current.followerCount;
      followingCount = current.followingCount;
      coinBalance = current.coinBalance;
    };
    profiles.add(user, updated);
    toView(updated);
  };

  public func toggleFollow(
    profiles : Map.Map<Common.UserId, Types.Profile>,
    follows : Map.Map<Common.UserId, Map.Map<Common.UserId, Bool>>,
    follower : Common.UserId,
    creator : Common.UserId,
  ) : Bool {
    if (follower == creator) { return false };
    let creatorMap = switch (follows.get(follower)) {
      case (?m) { m };
      case null {
        let m = Map.empty<Common.UserId, Bool>();
        follows.add(follower, m);
        m;
      };
    };
    let nowFollowing = switch (creatorMap.get(creator)) {
      case (?v) { not v };
      case null { true };
    };
    creatorMap.add(creator, nowFollowing);

    let followerProfile = getOrCreateProfile(profiles, follower);
    let creatorProfile = getOrCreateProfile(profiles, creator);

    let followerUpdated : Types.Profile = {
      owner = followerProfile.owner;
      displayName = followerProfile.displayName;
      avatar = followerProfile.avatar;
      followerCount = followerProfile.followerCount;
      followingCount = if (nowFollowing) { followerProfile.followingCount + 1 } else { followerProfile.followingCount };
      coinBalance = followerProfile.coinBalance;
    };
    profiles.add(follower, followerUpdated);

    let creatorUpdated : Types.Profile = {
      owner = creatorProfile.owner;
      displayName = creatorProfile.displayName;
      avatar = creatorProfile.avatar;
      followerCount = if (nowFollowing) { creatorProfile.followerCount + 1 } else { creatorProfile.followerCount };
      followingCount = creatorProfile.followingCount;
      coinBalance = creatorProfile.coinBalance;
    };
    profiles.add(creator, creatorUpdated);

    nowFollowing;
  };

  public func isFollowing(
    follows : Map.Map<Common.UserId, Map.Map<Common.UserId, Bool>>,
    follower : Common.UserId,
    creator : Common.UserId,
  ) : Bool {
    switch (follows.get(follower)) {
      case (?m) {
        switch (m.get(creator)) {
          case (?v) { v };
          case null { false };
        };
      };
      case null { false };
    };
  };
};
