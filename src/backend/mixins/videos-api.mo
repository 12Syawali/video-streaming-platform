import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/videos";
import Common "../types/common";
import VideosLib "../lib/videos";

mixin (
  videos : Map.Map<Common.VideoId, Types.Video>,
  state : { var nextVideoId : Nat },
) {
  public query func listFeed() : async [Types.VideoView] {
    VideosLib.listFeed(videos);
  };

  public query func listTrending() : async [Types.VideoView] {
    VideosLib.listTrending(videos);
  };

  public query func listByCategory(category : Common.Category) : async [Types.VideoView] {
    VideosLib.listByCategory(videos, category);
  };

  public query func getVideo(id : Common.VideoId) : async ?Types.VideoView {
    VideosLib.getVideo(videos, id);
  };

  public shared ({ caller }) func incrementViewCount(id : Common.VideoId) : async () {
    ignore caller;
    VideosLib.incrementViewCount(videos, id);
  };

  public shared ({ caller }) func createVideo(
    title : Text,
    description : Text,
    videoFile : Common.FileRef,
    thumbnail : Common.FileRef,
    category : Common.Category,
  ) : async Types.VideoView {
    VideosLib.createVideo(videos, state, caller, title, description, videoFile, thumbnail, category, Time.now());
  };

  public query ({ caller }) func listMyVideos() : async [Types.VideoView] {
    VideosLib.listByOwner(videos, caller);
  };
};
