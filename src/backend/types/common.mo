module {
  public type UserId = Principal;
  public type VideoId = Nat;
  public type Timestamp = Int;
  public type FileRef = Text;

  public type Category = {
    #game;
    #entertainment;
  };
};
