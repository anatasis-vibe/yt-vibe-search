export type Duration = "any"|"short"|"medium"|"long";

export interface SearchBody {
  mode: "channel" | "keyword" | "mixed";
  channels?: string[];
  keywords?: string[];
  days?: number;
  region?: string;
  lang?: string;
  perChannelLimit?: number;
  minViews?: number;
  duration?: Duration;
  order?: "relevance"|"date"|"viewCount";
  titleOnly?: boolean;

  // 🔥 새 필터들
  maxSubscribers?: number;        // 이 값 이하의 채널만
  minViewsPerHour?: number;       // 시간당 조회수 하한
  minViewToSubRatio?: number;     // 조회수/구독자 비율 하한 (ex. 0.5, 1, 2...)
}

export interface VideoLite {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  durationSec: number;
  viewCount: number;
  likeCount?: number;
  tags?: string[];
  thumbnails: { default?: string; high?: string };

  // 🔥 계산 필드들
  channelSubscriberCount?: number | null;
  viewsPerHour?: number;          // 시간당 조회수
  viewToSubRatio?: number | null; // viewCount / subscriberCount
}
