"use client";
import { useForm } from "react-hook-form";
import type { SearchBody } from "@/lib/types";

export function SettingsCard({ onSearch }: { onSearch: (b: SearchBody)=>void }) {
  const { register, handleSubmit } = useForm<SearchBody>({
    defaultValues: {
      mode: "keyword",
      days: 7,
      perChannelLimit: 10,
      minViews: 20000,
      duration: "any",
      order: "relevance",
      titleOnly: false,

      // 🔥 기본값(원하는 값으로 조절)
      maxSubscribers: 200000,      // 20만 이하 채널만
      minViewsPerHour: 0,          // 속도 하한 없음
      minViewToSubRatio: 0         // 비율 하한 없음
    }
  });

  return (
    <form onSubmit={handleSubmit(onSearch)} className="grid gap-3 p-4 rounded-2xl border">
      <div className="grid grid-cols-2 gap-3">
        {/* 기존 필드들 */}
        <label className="flex flex-col">
          <span className="text-sm">모드</span>
          <select {...register("mode")} className="border rounded p-2">
            <option value="keyword">키워드</option>
            <option value="channel">채널</option>
            <option value="mixed">혼합</option>
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-sm">최근 N일</span>
          <input type="number" {...register("days", { valueAsNumber:true })} className="border rounded p-2"/>
        </label>
        <label className="flex flex-col">
          <span className="text-sm">최소 조회수</span>
          <input type="number" {...register("minViews", { valueAsNumber:true })} className="border rounded p-2"/>
        </label>
        <label className="flex flex-col">
          <span className="text-sm">채널당 최대</span>
          <input type="number" {...register("perChannelLimit", { valueAsNumber:true })} className="border rounded p-2"/>
        </label>
        <label className="flex flex-col">
          <span className="text-sm">길이</span>
          <select {...register("duration")} className="border rounded p-2">
            <option value="any">전체</option>
            <option value="short">Short (&lt;4m)</option>
            <option value="medium">Medium (4–20m)</option>
            <option value="long">Long (&gt;20m)</option>
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-sm">정렬</span>
          <select {...register("order")} className="border rounded p-2">
            <option value="relevance">관련성</option>
            <option value="date">최신</option>
            <option value="viewCount">조회수</option>
          </select>
        </label>
      </div>

      {/* 🔥 새 필터 섹션 */}
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col">
          <span className="text-sm">최대 구독자 수(이하)</span>
          <input type="number" {...register("maxSubscribers", { valueAsNumber:true })} className="border rounded p-2" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm">최소 시간당 조회수</span>
          <input type="number" step="1" {...register("minViewsPerHour", { valueAsNumber:true })} className="border rounded p-2" />
        </label>
        <label className="flex flex-col">
          <span className="text-sm">최소 조회수/구독자 비율</span>
          <input type="number" step="0.1" {...register("minViewToSubRatio", { valueAsNumber:true })} className="border rounded p-2" />
        </label>
      </div>

      <label className="flex flex-col">
        <span className="text-sm">키워드(줄바꿈 구분)</span>
        <textarea {...register("keywords")} className="border rounded p-2 h-20"
          placeholder="예) 시니어 사업 노후&#10;부업 노하우"/>
      </label>

      <label className="flex flex-col">
        <span className="text-sm">채널(핸들/URL/ID, 줄바꿈 구분)</span>
        <textarea {...register("channels")} className="border rounded p-2 h-20"
          placeholder="@coffeemaster&#10;https://www.youtube.com/@baristalab"/>
      </label>

      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 rounded bg-black text-white">검색 시작</button>
      </div>
    </form>
  );
}