import Common "common";

module {
  public type VideoId = Common.VideoId;
  public type UserId = Common.UserId;

  public type LikeRecord = {
    videoId : VideoId;
    user : UserId;
  };

  public type SaveRecord = {
    videoId : VideoId;
    user : UserId;
  };

  public type FollowRecord = {
    follower : UserId;
    creator : UserId;
  };
};
