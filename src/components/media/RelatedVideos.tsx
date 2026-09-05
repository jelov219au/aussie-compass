import "server-only";
import { getPublicVideosForPlacement, videoChannel, type VideoContext } from "@/data/videos";
import { YouTubePlayer } from "./YouTubePlayer";

type RelatedVideosProps = {
  context: VideoContext;
  heading: string;
  id: string;
};

export function RelatedVideos({ context, heading, id }: RelatedVideosProps) {
  // One selected video per slot keeps the reading flow short as the registry grows.
  const video = getPublicVideosForPlacement(context)[0];
  if (!video) return null;

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="mt-8 min-w-0 scroll-mt-24 rounded-2xl border border-border bg-white p-4 sm:p-6">
      <h2 id={`${id}-heading`} className="text-xl font-semibold text-navy sm:text-2xl">{heading}</h2>
      <p className="mt-3 text-base leading-7 text-muted">{video.description}</p>
      <h3 className="mt-4 text-lg font-semibold leading-7 text-navy">{video.title}</h3>
      <div className="mt-4">
        <YouTubePlayer key={video.id} videoId={video.id} title={video.title} />
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">재생되지 않으면 YouTube에서 직접 열어보세요.</p>
      <div className="mt-2 flex flex-col items-start gap-x-6 gap-y-1 sm:flex-row sm:flex-wrap">
        <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center py-2 text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
          YouTube에서 보기 (새 창)
        </a>
        <a href={videoChannel.href} target="_blank" rel="noopener noreferrer" aria-label={`${videoChannel.name} 채널 방문 (새 창)`} className="inline-flex min-h-11 items-center py-2 text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
          Hoju Compass 채널 방문 (새 창)
        </a>
      </div>
    </section>
  );
}
