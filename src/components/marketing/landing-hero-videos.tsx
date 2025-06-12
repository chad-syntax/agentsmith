'use client';

import { useEffect, useRef, useState } from 'react';
import { GlassButton } from '../glass-button';
import { LANDING_VIDEOS } from '@/app/constants';
import { P } from '../typography';

export const LandingHeroVideos = () => {
  const [selectedVideoSlug, setSelectedVideoSlug] =
    useState<keyof typeof LANDING_VIDEOS>('typesafeSdk');

  const selectedVideo = LANDING_VIDEOS[selectedVideoSlug];
  const selectedVideoRef = useRef<typeof selectedVideoSlug>(selectedVideoSlug);
  const videoRef = useRef<HTMLVideoElement>(null);

  const selectVideo = (videoSlug: keyof typeof LANDING_VIDEOS) => {
    setSelectedVideoSlug(videoSlug);
  };

  useEffect(() => {
    const isNewVideoRef = selectedVideoRef.current !== selectedVideoSlug;
    if (videoRef.current && isNewVideoRef) {
      selectedVideoRef.current = selectedVideoSlug;
      videoRef.current.controls = false;
      videoRef.current.load();
    }
  }, [selectedVideoSlug]);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.controls = true;
    }
  };

  return (
    <div className="static container px-4 md:px-6 mx-auto lg:absolute lg:max-w-auto lg:px-0 lg:mx-0 lg:w-1/2 h-full right-0 top-0 flex flex-col justify-center">
      <div className="lg:pl-6 lg:pr-4">
        <div className="flex gap-2 justify-center flex-wrap pb-4 lg:pb-2">
          {Object.entries(LANDING_VIDEOS).map(([key, value]) => (
            <GlassButton
              key={key}
              onClick={() => selectVideo(key as keyof typeof LANDING_VIDEOS)}
              active={selectedVideoSlug === key}
              className=""
            >
              <value.icon size={4} />
              {value.buttonText}
            </GlassButton>
          ))}
        </div>
        <div className="relative">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="object-cover w-full rounded-sm border border-muted"
            poster={selectedVideo.cover.src}
            ref={videoRef}
            onMouseEnter={handleMouseEnter}
          >
            <source src={selectedVideo.webm} type="video/webm" />
            <source src={selectedVideo.mp4} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <P className="text-center lg:text-left min-h-[100px]">{selectedVideo.copy}</P>
        </div>
      </div>
    </div>
  );
};
