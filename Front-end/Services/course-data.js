(function (global) {
  function isArray(value) {
    return Array.isArray(value);
  }

  function firstArray(value, fallback) {
    return isArray(value) ? value : fallback;
  }

  function normalizeVideo(video, fallbackChapterOrder) {
    return {
      ...video,
      id: video?._id || video?.id || '',
      title: video?.title || 'Lesson',
      description: video?.description || '',
      chapterOrder: Number(video?.chapterOrder ?? fallbackChapterOrder ?? 0),
      order: Number(video?.order ?? 0),
      duration: Number(video?.duration ?? 0),
      isActive: video?.isActive !== false,
      progress: video?.progress || {
        watched: Boolean(video?.watched || video?.isWatched),
        watchedAt: video?.watchedAt || null,
        watchedDuration: Number(video?.watchedDuration || video?.progress?.watchedDuration || 0),
      },
    };
  }

  function normalizeChapter(chapter, options = {}) {
    const chapterOrder = Number(chapter?.order ?? options.fallbackOrder ?? 0);
    const videosFromPayload = firstArray(chapter?.videos, []);
    const fallbackVideos = firstArray(options.videos || [], []);
    const videos = (videosFromPayload.length ? videosFromPayload : fallbackVideos)
      .filter((video) => {
        if (video?.chapterId && chapter?.id) {
          return String(video.chapterId) === String(chapter.id);
        }

        const videoChapterOrder = Number(video?.chapterOrder ?? 0);
        return videoChapterOrder === chapterOrder || !videoChapterOrder;
      })
      .map((video) => normalizeVideo(video, chapterOrder))
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    return {
      ...chapter,
      id: chapter?._id || chapter?.id || '',
      title: chapter?.title || `Chapter ${chapterOrder || 1}`,
      description: chapter?.description || '',
      order: chapterOrder,
      videos,
      videoCount: videos.length,
      watchedCount: videos.filter((video) => Boolean(video?.progress?.watched || video?.watched || video?.isWatched)).length,
    };
  }

  function normalizeCoursePayload(payload) {
    const course = payload?.course || payload || {};
    const rawChapters = firstArray(course?.chapters, firstArray(payload?.chapters, []));
    const rawVideos = firstArray(course?.videos, firstArray(payload?.videos, []));

    const chapters = rawChapters.length
      ? rawChapters.map((chapter, index) => normalizeChapter(chapter, { fallbackOrder: index + 1, videos: rawVideos }))
      : [];

    const fallbackVideos = chapters.flatMap((chapter) => chapter.videos || []);
    const allVideos = fallbackVideos.length ? fallbackVideos : rawVideos.map((video) => normalizeVideo(video, Number(video?.chapterOrder || 0)));

    return {
      title: course?.title || payload?.title || 'The Complete Video Editing Masterclass',
      description: course?.description || payload?.description || '',
      slug: course?.slug || payload?.slug || '',
      progress: course?.progress || payload?.progress || payload?.userProgress || {},
      chapters,
      videos: allVideos,
      totalChapters: Number(payload?.totalChapters ?? chapters.length ?? 0),
      totalVideos: Number(payload?.totalVideos ?? allVideos.length ?? 0),
      totalWatched: Number(payload?.totalWatched ?? 0),
    };
  }

  global.normalizeCoursePayload = normalizeCoursePayload;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { normalizeCoursePayload };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
