import Map "mo:core/Map";
import Types "../types/engagement";
import VideoTypes "../types/videos";
import ProfileTypes "../types/profiles";
import Common "../types/common";

module {
  func toView(video : VideoTypes.Video) : VideoTypes.VideoView {
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

  func emptyView(owner : Common.UserId) : VideoTypes.VideoView {
    {
      id = 0;
      owner = owner;
      title = "";
      description = "";
      videoFile = "";
      thumbnail = "";
      viewCount = 0;
      likeCount = 0;
      createdAt = 0;
      category = #game;
    };
  };

  public func toggleLike(
    videos : Map.Map<Common.VideoId, VideoTypes.Video>,
    likes : Map.Map<Common.VideoId, Map.Map<Common.UserId, Bool>>,
    user : Common.UserId,
    videoId : Common.VideoId,
  ) : Bool {
    let video = switch (videos.get(videoId)) {
      case (?v) { v };
      case null { return false };
    };
    let likeMap = switch (likes.get(videoId)) {
      case (?m) { m };
      case null {
        let m = Map.empty<Common.UserId, Bool>();
        likes.add(videoId, m);
        m;
      };
    };
    let nowLiked = switch (likeMap.get(user)) {
      case (?v) { not v };
      case null { true };
    };
    likeMap.add(user, nowLiked);

    let updated : VideoTypes.Video = {
      id = video.id;
      owner = video.owner;
      title = video.title;
      description = video.description;
      videoFile = video.videoFile;
      thumbnail = video.thumbnail;
      viewCount = video.viewCount;
      likeCount = if (nowLiked) { video.likeCount + 1 } else { video.likeCount };
      createdAt = video.createdAt;
      category = video.category;
    };
    videos.add(videoId, updated);
    nowLiked;
  };

  public func toggleSave(
    saves : Map.Map<Common.UserId, Map.Map<Common.VideoId, Bool>>,
    user : Common.UserId,
    videoId : Common.VideoId,
  ) : Bool {
    let saveMap = switch (saves.get(user)) {
      case (?m) { m };
      case null {
        let m = Map.empty<Common.VideoId, Bool>();
        saves.add(user, m);
        m;
      };
    };
    let nowSaved = switch (saveMap.get(videoId)) {
      case (?v) { not v };
      case null { true };
    };
    saveMap.add(videoId, nowSaved);
    nowSaved;
  };

  public func listSaved(
    videos : Map.Map<Common.VideoId, VideoTypes.Video>,
    saves : Map.Map<Common.UserId, Map.Map<Common.VideoId, Bool>>,
    user : Common.UserId,
  ) : [VideoTypes.VideoView] {
    let saveMap = switch (saves.get(user)) {
      case (?m) { m };
      case null { return [] };
    };
    let savedIds = saveMap.entries().filter(func((_, saved)) = saved).map(func((id, _)) = id).toArray();
    let views = savedIds.map(func(id) = switch (videos.get(id)) {
      case (?v) { ?toView(v) };
      case null { null };
    });
    let present = views.filter(func(v) = v != null);
    let result = present.map(func(v) = switch (v) { case (?x) { x }; case null { emptyView(user) } });
    result.sort(func(a, b) = if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal });
  };

  public func getCoinBalance(profiles : Map.Map<Common.UserId, ProfileTypes.Profile>, user : Common.UserId) : Nat {
    switch (profiles.get(user)) {
      case (?p) { p.coinBalance };
      case null { 0 };
    };
  };

  public func creditCoins(
    profiles : Map.Map<Common.UserId, ProfileTypes.Profile>,
    user : Common.UserId,
    amount : Nat,
  ) : Nat {
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
    let updated : ProfileTypes.Profile = {
      owner = current.owner;
      displayName = current.displayName;
      avatar = current.avatar;
      followerCount = current.followerCount;
      followingCount = current.followingCount;
      coinBalance = current.coinBalance + amount;
    };
    profiles.add(user, updated);
    updated.coinBalance;
  };
};
