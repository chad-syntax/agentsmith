'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { LANDING_VIDEOS } from '@/app/constants';

export const LandingHeroVideos = () => {
  const [selectedVideoSlug, setSelectedVideoSlug] = useState<keyof typeof LANDING_VIDEOS | null>(
    'typesafeSdk',
  );

  const selectedVideo = selectedVideoSlug ? LANDING_VIDEOS[selectedVideoSlug] : null;

  console.log(selectedVideo);

  // TODO: fix this so we replace the video instead of force re-rendering it
  const selectVideo = (videoSlug: keyof typeof LANDING_VIDEOS) => {
    setSelectedVideoSlug(null);
    setTimeout(() => {
      setSelectedVideoSlug(videoSlug);
    }, 1);
  };

  return (
    <div className="absolute w-1/2 h-full right-0 top-0 flex flex-col justify-center">
      <div className="pl-6">
        <div className="flex gap-2 justify-center pb-2">
          {Object.entries(LANDING_VIDEOS).map(([key, value]) => (
            <Button key={key} onClick={() => selectVideo(key as keyof typeof LANDING_VIDEOS)}>
              {value.buttonText}
            </Button>
          ))}
        </div>
        <div className="relative pr-4">
          {selectedVideo ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="object-cover w-full rounded-sm border border-muted"
              poster={selectedVideo.cover.src}
            >
              <source src={selectedVideo.webm} type="video/webm" />
              <source src={selectedVideo.mp4} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full min-h-[450px]rounded-sm border border-muted" />
          )}
        </div>
      </div>
    </div>
  );
};
