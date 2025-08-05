'use client';

import { useEffect, useRef, useState } from 'react';
import { ShadowButton } from '../shadow-button';
import { LANDING_VIDEOS } from '@/app/constants';
import { P } from '../typography';
import { Button } from '../ui/button';
import Link from 'next/link';
import { routes } from '@/utils/routes';

const videoStructuredData = Object.values(LANDING_VIDEOS).map((video) => ({
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: video.buttonText,
  description: video.copy,
  thumbnailUrl: [video.cover.src],
  uploadDate: '2024-07-26T08:00:00+08:00',
  duration: video.duration,
  contentUrl: video.mp4,
  embedUrl: video.mp4,
}));

export const LandingHeroVideos = () => {
  const [selectedVideoSlug, setSelectedVideoSlug] =
    useState<keyof typeof LANDING_VIDEOS>('robustAuthoring');

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
    <>
      {videoStructuredData.map((data, index) => (
        <script
          key={`video-ld-json-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      <div className="static container px-4 md:px-6 mx-auto lg:absolute lg:max-w-auto lg:px-0 lg:mx-0 lg:w-1/2 h-full right-0 top-0 flex flex-col justify-center">
        <div className="lg:pl-6 lg:pr-4">
          <div className="flex gap-2 justify-center flex-wrap pb-4 lg:pb-2 4xl:pt-24">
            {Object.entries(LANDING_VIDEOS).map(([key, value]) => (
              <ShadowButton
                key={key}
                onClick={() => selectVideo(key as keyof typeof LANDING_VIDEOS)}
                active={selectedVideoSlug === key}
                className=""
              >
                <value.icon size={4} />
                {value.buttonText}
              </ShadowButton>
            ))}
          </div>
          <div className="relative">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full rounded-sm border border-muted"
              poster={selectedVideo.cover.src}
              ref={videoRef}
              onMouseEnter={handleMouseEnter}
            >
              <source src={selectedVideo.webm} type="video/webm" />
              <source src={selectedVideo.mp4} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <P className="text-center lg:text-left min-h-[100px]">
              {selectedVideo.copy}
              <br />
              <Button className="px-0 text-base" variant="link" size="sm" asChild>
                <Link href={routes.marketing.demo}>Watch the full demo &rarr;</Link>
              </Button>
            </P>
          </div>
        </div>
      </div>
    </>
  );
};
