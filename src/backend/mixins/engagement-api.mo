import Map "mo:core/Map";
import VideoTypes "../types/videos";
import ProfileTypes "../types/profiles";
import Common "../types/common";
import EngagementLib "../lib/engagement";

mixin (
  videos : Map.Map<Common.VideoId, VideoTypes.Video>,
  profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
  likes : Map.Map<Common.VideoId, Map.Map<Common.UserId, Bool>>,
  saves : Map.Map<Common.UserId, Map.Map<Common.VideoId, Bool>>,
) {
  public shared ({ caller }) func toggleLike(videoId : Common.VideoId) : async Bool {
    EngagementLib.toggleLike(videos, likes, caller, videoId);
  };

  public shared ({ caller }) func toggleSave(videoId : Common.VideoId) : async Bool {
    EngagementLib.toggleSave(saves, caller, videoId);
  };

  public query ({ caller }) func listMySaved() : async [VideoTypes.VideoView] {
    EngagementLib.listSaved(videos, saves, caller);
  };

  public query ({ caller }) func getMyCoinBalance() : async Nat {
    EngagementLib.getCoinBalance(profiles, caller);
  };

  public shared ({ caller }) func creditMyCoins(amount : Nat) : async Nat {
    EngagementLib.creditCoins(profiles, caller, amount);
  };
};
