"use client";
import { useForm } from "react-hook-form";
import type { SearchBody } from "@/lib/types";

function L({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-gray-700">{children}</label>;
}
function I(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}
function S(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}

export function SettingsCard({ onSearch }: { onSearch: (b: SearchBody) => void }) {
  const { register, handleSubmit } = useForm<SearchBody>({
    defaultValues: {
      mode: "keyword",
      days: 7,
      perChannel: 10,
      minViews: 20000,
      maxSubs: 200000,
      minVph: 0,
      minVpr: 0,
      order: "relevance",
      duration: "any",
      keywords: "",
      channels: ""
    }
  });

  return (
    <form
      onSubmit={handleSubmit(onSearch)}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">검색 조건</h2>
        <button
          type="submit"
          className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium
                     text-white hover:bg-indigo-500 active:bg-indigo-700"
        >
          검색 시작
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <L>모드</L>
          <S {...register("mode")}>
            <option value="keyword">키워드</option>
            <option value="channel">채널</option>
          </S>
        </div>
        <div>
          <L>최근 N일</L>
          <I type="number" {...register("days", { valueAsNumber: true })} />
        </div>
        <div>
          <L>최소 조회수</L>
          <I type="number" {...register("minViews", { valueAsNumber: true })} />
        </div>
        <div>
          <L>채널당 최대</L>
          <I type="number" {...register("perChannel", { valueAsNumber: true })} />
        </div>
        <div>
          <L>길이</L>
          <S {...register("duration")}>
            <option value="any">전체</option>
            <option value="short">Short (&lt;4m)</option>
            <option value="medium">Medium (4~20m)</option>
            <option value="long">Long (&gt;20m)</option>
          </S>
        </div>
        <div>
          <L>정렬</L>
          <S {...register("order")}>
            <option value="relevance">관련성</option>
            <option value="date">최신순</option>
            <option value="viewCount">조회수순</option>
          </S>
        </div>
        <div>
          <L>최대 구독자 수(이하)</L>
          <I type="number" {...register("maxSubs", { valueAsNumber: true })} />
        </div>
        <div>
          <L>최소 시간당 조회수</L>
          <I type="number" {...register("minVph", { valueAsNumber: true })} />
        </div>
        <div>
          <L>최소 조회수/구독자 비율</L>
          <I type="number" step="0.1" {...register("minVpr", { valueAsNumber: true })} />
        </div>
        <div className="md:col-span-2">
          <L>키워드(줄바꿈 구분)</L>
          <textarea
            rows={3}
            {...register("keywords")}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="예) 시니어 사업, 노후 부업, 노하우"
          />
        </div>
        <div className="md:col-span-2">
          <L>채널(핸들/URL/ID, 줄바꿈 구분)</L>
          <textarea
            rows={2}
            {...register("channels")}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="@coffeemaster https://www.youtube.com/@baristalab"
          />
        </div>
      </div>
    </form>
  );
}