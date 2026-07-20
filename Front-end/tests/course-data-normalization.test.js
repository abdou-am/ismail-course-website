const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeCoursePayload } = require('../Services/course-data.js');

test('normalizes the new backend course payload shape', () => {
  const payload = {
    course: {
      id: 'course-1',
      title: 'Masterclass',
      description: 'A course',
      slug: 'masterclass',
    },
    chapters: [
      {
        id: 'chapter-1',
        title: 'Chapter 1',
        description: 'Intro',
        order: 1,
        videos: [
          {
            id: 'video-1',
            title: 'Lesson 1',
            chapterOrder: 1,
            order: 1,
            duration: 540,
            isActive: true,
            progress: { watched: false, watchedAt: null, watchedDuration: 0 },
          },
        ],
      },
    ],
    totalChapters: 1,
    totalVideos: 1,
    totalWatched: 0,
  };

  const normalized = normalizeCoursePayload(payload);

  assert.equal(normalized.title, 'Masterclass');
  assert.equal(normalized.chapters.length, 1);
  assert.equal(normalized.chapters[0].videos.length, 1);
  assert.equal(normalized.chapters[0].videos[0].title, 'Lesson 1');
  assert.equal(normalized.totalVideos, 1);
});

test('supports the legacy payload shape with nested course videos', () => {
  const payload = {
    course: {
      title: 'Legacy course',
      chapters: [
        {
          id: 'chapter-2',
          title: 'Legacy chapter',
          order: 2,
        },
      ],
      videos: [
        {
          id: 'video-2',
          title: 'Legacy lesson',
          chapterOrder: 2,
          order: 1,
          duration: 300,
        },
      ],
    },
  };

  const normalized = normalizeCoursePayload(payload);

  assert.equal(normalized.chapters.length, 1);
  assert.equal(normalized.chapters[0].videos.length, 1);
  assert.equal(normalized.chapters[0].videos[0].id, 'video-2');
});
