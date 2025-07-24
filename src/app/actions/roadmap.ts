'use server';

import { revalidatePath } from 'next/cache';

export const revalidateRoadmapAction = async () => {
  revalidatePath('/roadmap');
};
