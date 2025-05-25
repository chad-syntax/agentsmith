import {
  AgentsmithSupabaseService,
  AgentsmithSupabaseServiceConstructorOptions,
} from './AgentsmithSupabaseService';
import type { Enums, Tables, TablesInsert, TablesUpdate } from '@/app/__generated__/supabase.types';
import { slugify } from '@/utils/slugify';

// Base types from Supabase generated types
type RoadmapItemRow = Tables<'roadmap_items'>;
type RoadmapUpvoteRow = Tables<'roadmap_upvotes'>;

// Service-level types directly using or deriving from Supabase generated types
export type RoadmapItem = RoadmapItemRow;
export type RoadmapUpvote = RoadmapUpvoteRow;

export type GetRoadmapItemsOptions = {
  states?: Enums<'roadmap_item_state'>[];
  orderBy?: {
    column: keyof RoadmapItem;
    ascending: boolean;
  }[];
  limit?: number;
  offset?: number;
};

export type CreateRoadmapItemPayload = Pick<
  TablesInsert<'roadmap_items'>,
  'creator_user_id' | 'title' | 'body'
> & { initial_impact_score: number };

export type UpdateRoadmapItemPayload = Pick<
  TablesUpdate<'roadmap_items'>,
  'title' | 'body' | 'state' // state is now string | undefined from generated types
>;

export type UpsertRoadmapUpvotePayload = Pick<
  TablesInsert<'roadmap_upvotes'>,
  'roadmap_item_id' | 'user_id' | 'score' // score is now number from generated types
>;

export class RoadmapService extends AgentsmithSupabaseService {
  constructor(options: AgentsmithSupabaseServiceConstructorOptions) {
    super({ ...options, serviceName: 'roadmap' });
  }

  public async getRoadmapItems(options?: GetRoadmapItemsOptions): Promise<RoadmapItem[]> {
    let query = this.supabase.from('roadmap_items').select('*');

    if (options?.states && options.states.length > 0) {
      query = query.in('state', options.states);
    }

    if (options?.orderBy && options.orderBy.length > 0) {
      options.orderBy.forEach((order) => {
        query = query.order(order.column as string, { ascending: order.ascending });
      });
    } else {
      query = query
        .order('avg_score', { ascending: false })
        .order('upvote_count', { ascending: false });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 0) - 1);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Error getting roadmap items', { error, options });
      throw new Error(error.message);
    }
    return data || [];
  }

  public async getRoadmapItemById(id: number): Promise<RoadmapItem | null> {
    const { data, error } = await this.supabase
      .from('roadmap_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error('Error getting roadmap item by ID', { error, id });
      throw new Error(error.message);
    }
    return data;
  }

  public async getRoadmapItemBySlug(slug: string): Promise<RoadmapItem | null> {
    const { data, error } = await this.supabase
      .from('roadmap_items')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      this.logger.error('Error getting roadmap item by slug', { error, slug });
      throw new Error(error.message);
    }
    return data;
  }

  public async createRoadmapItem(payload: CreateRoadmapItemPayload): Promise<RoadmapItem> {
    const slug = slugify(payload.title);
    const itemToInsert: TablesInsert<'roadmap_items'> = {
      creator_user_id: payload.creator_user_id,
      title: payload.title,
      body: payload.body,
      slug,
      // avg_score and upvote_count will be updated by triggers/functions when upvotes are added
    };

    const { data: newItem, error: createError } = await this.supabase
      .from('roadmap_items')
      .insert(itemToInsert)
      .select()
      .single();

    if (createError || !newItem) {
      this.logger.error('Error creating roadmap item', { error: createError, payload });
      if (
        createError?.code === '23505' &&
        createError?.message.includes('roadmap_items_slug_key')
      ) {
        throw new Error(`A roadmap item with a similar title (slug: ${slug}) may already exist.`);
      }
      throw new Error(
        createError?.message || 'Failed to create roadmap item and no data returned.',
      );
    }

    // After creating the item, create an initial upvote from the creator
    try {
      await this.createOrUpdateUpvote({
        roadmap_item_id: newItem.id,
        user_id: payload.creator_user_id,
        score: payload.initial_impact_score,
      });
    } catch (upvoteError: any) {
      // Log the error, but don't let it fail the whole item creation if the item itself was created.
      // The user might see the item without their initial vote, which is better than full failure.
      // A retry mechanism or cleanup could be considered for production.
      this.logger.error('Error creating initial upvote for roadmap item', {
        error: upvoteError,
        roadmap_itemId: newItem.id,
        userId: payload.creator_user_id,
        score: payload.initial_impact_score,
      });
      // Potentially throw a more specific error or add a warning to the return if partial success is problematic
    }

    // Return the newly created item. It might not have the up-to-date avg_score/upvote_count
    // immediately if triggers are asynchronous or if the upvote call above had issues.
    // Client might need to refresh or the item object might need to be re-fetched.
    // For simplicity here, returning the item as created.
    // To get the most up-to-date item, we could re-fetch it here:
    // return this.getRoadmapItemById(newItem.id);
    // However, this adds another DB call. Let's return newItem for now.
    return newItem;
  }

  public async updateRoadmapItem(
    id: number,
    payload: UpdateRoadmapItemPayload,
  ): Promise<RoadmapItem> {
    const itemToUpdate: TablesUpdate<'roadmap_items'> = {};

    if (payload.title) {
      itemToUpdate.title = payload.title;
      itemToUpdate.slug = slugify(payload.title);
    }
    if (payload.body) {
      itemToUpdate.body = payload.body;
    }
    if (payload.state) {
      itemToUpdate.state = payload.state;
    }

    itemToUpdate.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('roadmap_items')
      .update(itemToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Error updating roadmap item', { error, id, payload });
      if (
        error?.code === '23505' &&
        itemToUpdate.slug &&
        error?.message.includes('roadmap_items_slug_key')
      ) {
        throw new Error(
          `A roadmap item with a similar title (slug: ${itemToUpdate.slug}) may already exist.`,
        );
      }
      throw new Error(error?.message || 'Failed to update roadmap item and no data returned.');
    }
    return data;
  }

  public async searchRoadmapItems(searchTerm: string): Promise<RoadmapItem[]> {
    const { data, error } = (await this.supabase.rpc('search_roadmap_items', {
      search_term: searchTerm,
    })) as { data: RoadmapItemRow[] | null; error: any };

    if (error) {
      this.logger.error('Error searching roadmap items', { error, searchTerm });
      throw new Error(error.message);
    }
    return data || [];
  }

  public async getUserUpvotes(user_id: number): Promise<RoadmapUpvote[]> {
    const { data, error } = await this.supabase
      .from('roadmap_upvotes')
      .select('*')
      .eq('user_id', user_id);

    if (error) {
      this.logger.error('Error getting user upvotes', { error });
      throw new Error(error.message);
    }
    return data || [];
  }

  public async getUserUpvoteForItem(
    roadmap_item_id: number,
    user_id: number,
  ): Promise<RoadmapUpvote | null> {
    const { data, error } = await this.supabase
      .from('roadmap_upvotes')
      .select('*')
      .eq('roadmap_item_id', roadmap_item_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      this.logger.error('Error getting user upvote for item', {
        error,
        roadmap_item_id,
        user_id,
      });
      throw new Error(error.message);
    }
    return data;
  }

  public async createOrUpdateUpvote(payload: UpsertRoadmapUpvotePayload): Promise<RoadmapUpvote> {
    const upvoteData: TablesInsert<'roadmap_upvotes'> = {
      ...payload,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('roadmap_upvotes')
      .upsert(upvoteData, { onConflict: 'roadmap_item_id, user_id' })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Error creating or updating upvote', { error, payload });
      throw new Error(error?.message || 'Failed to create/update upvote and no data returned.');
    }
    return data;
  }

  public async deleteUpvote(roadmap_item_id: number, user_id: number): Promise<void> {
    const { error, count } = await this.supabase
      .from('roadmap_upvotes')
      .delete({ count: 'exact' })
      .eq('roadmap_item_id', roadmap_item_id)
      .eq('user_id', user_id);

    if (error) {
      this.logger.error('Error deleting upvote', {
        error,
        roadmap_item_id,
        user_id,
      });
      throw new Error(error.message);
    }

    if (count === 0) {
      this.logger.warn('Attempted to delete non-existent upvote or RLS prevented deletion', {
        roadmap_item_id,
        user_id,
      });
    }
  }
}

// Helper types for public method return values
export type GetRoadmapItemsResult = Awaited<
  ReturnType<typeof RoadmapService.prototype.getRoadmapItems>
>;
export type GetRoadmapItemByIdResult = Awaited<
  ReturnType<typeof RoadmapService.prototype.getRoadmapItemById>
>;
export type GetRoadmapItemBySlugResult = Awaited<
  ReturnType<typeof RoadmapService.prototype.getRoadmapItemBySlug>
>;
export type CreateRoadmapItemResult = Awaited<
  ReturnType<typeof RoadmapService.prototype.createRoadmapItem>
>;
export type UpdateRoadmapItemResult = Awaited<
  ReturnType<typeof RoadmapService.prototype.updateRoadmapItem>
>;
export type SearchRoadmapItemsResult = Awaited<
  ReturnType<typeof RoadmapService.prototype.searchRoadmapItems>
>;
export type GetUserUpvoteForItemResult = Awaited<
  ReturnType<typeof RoadmapService.prototype.getUserUpvoteForItem>
>;
export type CreateOrUpdateUpvoteResult = Awaited<
  ReturnType<typeof RoadmapService.prototype.createOrUpdateUpvote>
>;
export type GetUserUpvotesResult = Awaited<
  ReturnType<typeof RoadmapService.prototype.getUserUpvotes>
>;
