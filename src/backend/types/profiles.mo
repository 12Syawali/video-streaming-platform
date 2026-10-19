import Common "common";

module {
  public type UserId = Common.UserId;
  public type FileRef = Common.FileRef;

  public type Profile = {
    owner : UserId;
    displayName : Text;
    avatar : ?FileRef;
    followerCount : Nat;
    followingCount : Nat;
    coinBalance : Nat;
  };

  public type ProfileView = {
    owner : UserId;
    displayName : Text;
    avatar : ?FileRef;
    followerCount : Nat;
    followingCount : Nat;
    coinBalance : Nat;
  };
};
