import { Tiktoken } from 'js-tiktoken/lite';

export const emojiTokenify = (content: string, tokenBpe: any, emojiList: string[]) => {
  const enc = new Tiktoken(tokenBpe);
  const tokens = enc.encode(content);

  const emojiMap = new Map<number, string>();
  const usedEmojis = new Set<string>();
  let emojiIndex = 0;

  // assign each token to a emoji
  const emojiTokens = tokens.map((token) => {
    if (emojiMap.has(token)) {
      return emojiMap.get(token);
    }

    // pick the first unused emoji from the list
    const emoji = emojiList[emojiIndex] ?? '*';
    emojiIndex++;

    usedEmojis.add(emoji);
    emojiMap.set(token, emoji);

    return emoji;
  });

  console.groupCollapsed('Token Mappings');
  tokens.forEach((token, index) => {
    const tokenContent = enc.decode([token]);
    const emoji = emojiMap.get(token);
    console.log(`Token #${index}[${token}]: "${tokenContent}" -> ${emoji}`);
  });
  console.groupEnd();

  return emojiTokens.join('');
};
