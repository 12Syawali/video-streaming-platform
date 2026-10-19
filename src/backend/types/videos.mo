import Common "common";

module {
  public type VideoId = Common.VideoId;
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type FileRef = Common.FileRef;
  public type Category = Common.Category;

  public type Video = {
    id : VideoId;
    owner : UserId;
    title : Text;
    description : Text;
    videoFile : FileRef;
    thumbnail : FileRef;
    viewCount : Nat;
    likeCount : Nat;
    createdAt : Timestamp;
    category : Category;
  };

  public type VideoView = {
    id : VideoId;
    owner : UserId;
    title : Text;
    description : Text;
    videoFile : FileRef;
    thumbnail : FileRef;
    viewCount : Nat;
    likeCount : Nat;
    createdAt : Timestamp;
    category : Category;
  };
};
