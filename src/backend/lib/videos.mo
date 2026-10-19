import Map "mo:core/Map";
import Array "mo:core/Array";
import Types "../types/videos";
import Common "../types/common";

module {
  public func toView(video : Types.Video) : Types.VideoView {
    {
      id = video.id;
      owner = video.owner;
      title = video.title;
      description = video.description;
      videoFile = video.videoFile;
      thumbnail = video.thumbnail;
      viewCount = video.viewCount;
      likeCount = video.likeCount;
      createdAt = video.createdAt;
      category = video.category;
    };
  };

  public func listFeed(videos : Map.Map<Common.VideoId, Types.Video>) : [Types.VideoView] {
    let all = videos.values().toArray();
    let sorted = all.sort(func(a, b) = if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal });
    sorted.map(func(v) = toView(v));
  };

  public func listTrending(videos : Map.Map<Common.VideoId, Types.Video>) : [Types.VideoView] {
    let all = videos.values().toArray();
    let sorted = all.sort(func(a, b) = if (a.viewCount > b.viewCount) { #less } else if (a.viewCount < b.viewCount) { #greater } else { #equal });
    sorted.map(func(v) = toView(v));
  };

  public func listByCategory(videos : Map.Map<Common.VideoId, Types.Video>, category : Common.Category) : [Types.VideoView] {
    let all = videos.values().toArray();
    let filtered = all.filter(func(v) = v.category == category);
    let sorted = filtered.sort(func(a, b) = if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal });
    sorted.map(func(v) = toView(v));
  };

  public func getVideo(videos : Map.Map<Common.VideoId, Types.Video>, id : Common.VideoId) : ?Types.VideoView {
    switch (videos.get(id)) {
      case (?v) { ?toView(v) };
      case null { null };
    };
  };

  public func incrementViewCount(videos : Map.Map<Common.VideoId, Types.Video>, id : Common.VideoId) : () {
    switch (videos.get(id)) {
      case (?v) {
        let updated : Types.Video = {
          id = v.id;
          owner = v.owner;
          title = v.title;
          description = v.description;
          videoFile = v.videoFile;
          thumbnail = v.thumbnail;
          viewCount = v.viewCount + 1;
          likeCount = v.likeCount;
          createdAt = v.createdAt;
          category = v.category;
        };
        videos.add(id, updated);
      };
      case null {};
    };
  };

  public func createVideo(
    videos : Map.Map<Common.VideoId, Types.Video>,
    state : { var nextVideoId : Nat },
    owner : Common.UserId,
    title : Text,
    description : Text,
    videoFile : Common.FileRef,
    thumbnail : Common.FileRef,
    category : Common.Category,
    createdAt : Common.Timestamp,
  ) : Types.VideoView {
    let id = state.nextVideoId;
    state.nextVideoId := id + 1;
    let video : Types.Video = {
      id = id;
      owner = owner;
      title = title;
      description = description;
      videoFile = videoFile;
      thumbnail = thumbnail;
      viewCount = 0;
      likeCount = 0;
      createdAt = createdAt;
      category = category;
    };
    videos.add(id, video);
    toView(video);
  };

  public func listByOwner(videos : Map.Map<Common.VideoId, Types.Video>, owner : Common.UserId) : [Types.VideoView] {
    let all = videos.values().toArray();
    let filtered = all.filter(func(v) = v.owner == owner);
    let sorted = filtered.sort(func(a, b) = if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal });
    sorted.map(func(v) = toView(v));
  };
};
