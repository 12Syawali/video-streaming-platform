import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cell {
    value: Value;
    name: string;
}
export interface CoinPack {
    id: string;
    name: string;
    coins: bigint;
    description: string;
    currency: string;
    priceInCents: bigint;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type FileRef = string;
export interface HttpHeader {
    value: string;
    name: string;
}
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface ProfileView {
    displayName: string;
    owner: UserId;
    coinBalance: bigint;
    followerCount: bigint;
    followingCount: bigint;
    avatar?: FileRef;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export type Timestamp = bigint;
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export type UserId = Principal;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type VideoId = bigint;
export interface VideoView {
    id: VideoId;
    title: string;
    likeCount: bigint;
    thumbnail: FileRef;
    owner: UserId;
    createdAt: Timestamp;
    description: string;
    videoFile: FileRef;
    viewCount: bigint;
    category: Category;
}
export enum Category {
    entertainment = "entertainment",
    game = "game"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    confirmCoinPurchase(sessionId: string, packId: string): Promise<bigint>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createCoinCheckout(packId: string, successUrl: string, cancelUrl: string): Promise<string>;
    createVideo(title: string, description: string, videoFile: FileRef, thumbnail: FileRef, category: Category): Promise<VideoView>;
    creditMyCoins(amount: bigint): Promise<bigint>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getMyCoinBalance(): Promise<bigint>;
    getMyProfile(): Promise<ProfileView>;
    getProfile(user: UserId): Promise<ProfileView | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getVideo(id: VideoId): Promise<VideoView | null>;
    incrementViewCount(id: VideoId): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isFollowing(creator: UserId): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listByCategory(category: Category): Promise<Array<VideoView>>;
    listCoinPacks(): Promise<Array<CoinPack>>;
    listFeed(): Promise<Array<VideoView>>;
    listMySaved(): Promise<Array<VideoView>>;
    listMyVideos(): Promise<Array<VideoView>>;
    listTrending(): Promise<Array<VideoView>>;
    schema(): Promise<string>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    toggleFollow(creator: UserId): Promise<boolean>;
    toggleLike(videoId: VideoId): Promise<boolean>;
    toggleSave(videoId: VideoId): Promise<boolean>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateMyProfile(displayName: string, avatar: FileRef | null): Promise<ProfileView>;
}
