import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Stripe "mo:caffeineai-stripe/stripe";
import MixinStripe "mo:caffeineai-stripe/MixinStripe";

import Common "types/common";
import VideoTypes "types/videos";
import ProfileTypes "types/profiles";
import CoinTypes "types/coins";

import VideosApi "mixins/videos-api";
import ProfilesApi "mixins/profiles-api";
import EngagementApi "mixins/engagement-api";
import CoinsApi "mixins/coins-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;

  let videos : Map.Map<Common.VideoId, VideoTypes.Video>;
  let profiles : Map.Map<Common.UserId, ProfileTypes.Profile>;
  let likes : Map.Map<Common.VideoId, Map.Map<Common.UserId, Bool>>;
  let saves : Map.Map<Common.UserId, Map.Map<Common.VideoId, Bool>>;
  let follows : Map.Map<Common.UserId, Map.Map<Common.UserId, Bool>>;
  let state : { var nextVideoId : Nat };
  let credited : Map.Map<Text, CoinTypes.CreditedSession>;
  let stripeState : Stripe.StripeState;

  transient let anyPrincipal = Principal.fromText("aaaaa-aa");

  func categoryToText(category : Common.Category) : Text {
    switch (category) {
      case (#game) { "game" };
      case (#entertainment) { "entertainment" };
    };
  };

  include MixinAuthorization(accessControlState, null);
  include MixinStripe(accessControlState, stripeState);
  include VideosApi(videos, state);
  include ProfilesApi(profiles, follows);
  include EngagementApi(videos, profiles, likes, saves);
  include CoinsApi(profiles, credited, stripeState, transform);
  include ApiDocMixin();
  include Expose({
    entities = [
      videos.toEntityManual("video", "Video", "id")
        .sample({
          id = 0;
          owner = anyPrincipal;
          title = "";
          description = "";
          videoFile = "";
          thumbnail = "";
          viewCount = 0;
          likeCount = 0;
          createdAt = 0;
          category = #game;
        })
        .payload("id", func v = v.id)
        .payload("owner", func v = v.owner)
        .payload("title", func v = v.title)
        .payload("description", func v = v.description)
        .payload("videoFile", func v = v.videoFile)
        .payload("thumbnail", func v = v.thumbnail)
        .payload("viewCount", func v = v.viewCount)
        .payload("likeCount", func v = v.likeCount)
        .payload("createdAt", func v = v.createdAt)
        .payload("category", func v = categoryToText(v.category))
        .public_()
        .build(),
      profiles.toEntityManual("profile", "Profile", "owner")
        .sample({
          owner = anyPrincipal;
          displayName = "";
          avatar = ?"";
          followerCount = 0;
          followingCount = 0;
          coinBalance = 0;
        })
        .payload("owner", func p = p.owner)
        .payload("displayName", func p = p.displayName)
        .payload("avatar", func p = switch (p.avatar) { case (?a) { a }; case null { "" } })
        .payload("followerCount", func p = p.followerCount)
        .payload("followingCount", func p = p.followingCount)
        .payload("coinBalance", func p = p.coinBalance)
        .public_()
        .build(),
    ];
  });
};
