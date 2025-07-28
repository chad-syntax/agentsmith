import { H1, H2, P } from '@/components/typography';

export const DemoPage = () => {
  return (
    <section className="container pt-4 md:pt-8 px-2 md:px-6 mx-auto">
      <H1 className="text-center mb-8">Agentsmith Demo</H1>
      <iframe
        className="w-4/5 aspect-video mx-auto rounded border-muted shadow-lg border-2 mb-16"
        src="https://www.youtube.com/embed/MrL9Dk4CQlc?si=yGnYQQhCuGYVI7A7"
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      <div id="book">
        <H2 className="border-none text-center pb-0">Still need to know more?</H2>
        <P className="text-center mb-8">
          Book a demo with our team to see how Agentsmith can accelerate your iteration and
          integration with LLMs.
        </P>
        <iframe
          src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ1-T3kCHhKOwUYic1fp3XpetEwA0yEN83KmbbZdFE9qczyeufiIAYw-ji981oJ6hqWaWueChRGS?gv=true"
          className="w-full mx-auto h-[1700px] sm:h-[1100px] border-2 border-muted rounded-lg shadow-lg mb-16"
        />
      </div>
    </section>
  );
};
