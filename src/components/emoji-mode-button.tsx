import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/utils/shadcn';
import { toast } from 'sonner';

type EmojiModeButtonProps = {
  onEnabledChange: (enabled: boolean) => void;
  onEmojiListLoaded: (emojiList: string[]) => void;
};

export const EmojiModeButton = (props: EmojiModeButtonProps) => {
  const { onEnabledChange, onEmojiListLoaded } = props;
  const [enabled, setEnabled] = useState(false);
  const [emoji, setEmoji] = useState<string | null>(null);
  const emojiRef = useRef<string[]>([]);

  const initialize = async () => {
    if (emojiRef.current.length > 0) return;
    const emojilist = await import('@/constants/emoji-compact-randomized.json');
    emojiRef.current = emojilist.default;
    setEmoji(getRandomEmoji());
    onEmojiListLoaded(emojiRef.current);
    toast.warning('Emoji mode discovered!', {
      description: (
        <div>
          This is how an LLM will see your prompt.
          <br />
          (except with numbers instead of emojis)
          <br />
          Neat, right?
        </div>
      ),
      richColors: true,
      icon: '🎉',
    });
  };

  const getRandomEmoji = () => {
    return emojiRef.current[Math.floor(Math.random() * emojiRef.current.length)] ?? null;
  };

  const handleClick = () => {
    const newEnabled = !enabled;

    setEnabled(newEnabled);
    onEnabledChange(newEnabled);
  };

  if (!emoji) {
    return (
      <div
        onClick={() => initialize().then(() => handleClick())}
        className="w-[24px] h-[24px] opacity-0 cursor-pointer"
      />
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        'size-6 rounded-xs opacity-0 hover:opacity-100 transition-opacity',
        enabled && 'opacity-100 border-primary border',
      )}
      size="icon"
      onClick={handleClick}
      onMouseEnter={enabled ? undefined : () => setEmoji(getRandomEmoji())}
    >
      {emoji}
    </Button>
  );
};
