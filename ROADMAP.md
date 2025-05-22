# Product Roadmap & Feedback System

> _Inspiration from a Reddit comment (see Appendix) and internal discussion_

---

## 1. Problem Statement

We need a lightweight yet powerful mechanism for customers to:

1. Propose new ideas or identify pain-points.
2. Signal how important a request is (1-5 scale).
3. Track progress as ideas move through our delivery pipeline.
4. Be notified when something they care about changes state or receives updates.

This document defines the schema, database logic, permissions, UX flows, and alerting logic for our new **Roadmap** feature.

---

## 2. Key Goals

- **Surface High-Impact Work:** Use crowdsourced scoring to bubble up the most valuable ideas.
- **Transparency:** Clearly show what is planned, in-progress, or completed.
- **Customer Engagement:** Close the loop with status change notifications.
- **Simplicity:** MVP should be shippable within a reasonable timeframe.

---

## 3. Data Model

### 3.1 Tables

| Table             | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `roadmap_items`   | Canonical list of ideas / feature requests.                |
| `roadmap_upvotes` | 1-5 impact votes from authenticated users.                 |
| `alerts`          | Generic notification queue for various user-facing events. |

#### 3.1.1 `roadmap_items`

```sql
id                bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY
creator_user_id   bigint NOT NULL REFERENCES public.agentsmith_users(id)
slug              text UNIQUE NOT NULL -- for marketing URLs, generated from title
title             text NOT NULL
body              text NOT NULL
state             text NOT NULL CHECK (state IN ('PROPOSED','REJECTED','PLANNED','IN_PROGRESS','CANCELLED','COMPLETED')) DEFAULT 'PROPOSED'
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()
-- denormalised metrics for fast reads
upvote_count      integer DEFAULT 0
avg_score         numeric(3,2) DEFAULT 0.00 -- 1.00–5.00
```

#### 3.1.2 `roadmap_upvotes`

```sql
id                bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY
roadmap_item_id   bigint NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE
user_id           bigint NOT NULL REFERENCES public.agentsmith_users(id) ON DELETE CASCADE
score             smallint NOT NULL CHECK (score BETWEEN 1 AND 5)
created_at        timestamptz DEFAULT now()
updated_at        timestamptz DEFAULT now()

UNIQUE (roadmap_item_id, user_id) -- one vote per user per item
```

#### 3.1.3 `alerts` (Generic)

```sql
id                bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY
uuid              uuid UNIQUE NOT NULL DEFAULT gen_random_uuid() -- For direct linking if needed
user_id           bigint NOT NULL REFERENCES public.agentsmith_users(id) ON DELETE CASCADE
type              text NOT NULL  -- e.g., 'ROADMAP_ITEM_STATE_CHANGED', 'NEW_FEATURE_ANNOUNCEMENT'
title             text NOT NULL  -- Short summary of the alert
description       text NULL      -- Longer details, if applicable
roadmap_item_id   bigint NULL REFERENCES roadmap_items(id) ON DELETE SET NULL -- Link to specific item if relevant
created_at        timestamptz DEFAULT now()
read_at           timestamptz NULL -- Timestamp when the user marked it as read
```

### 3.2 Database Indices

- **`roadmap_items`**:
  - `(creator_user_id)`: To efficiently query items created by a specific user.
  - `(state)`: To efficiently filter items by their current status (e.g., for public roadmap view: 'PLANNED', 'IN_PROGRESS', 'COMPLETED').
  - `(avg_score DESC, upvote_count DESC)`: Composite index for sorting the public roadmap to show highest impact items first.
- **`roadmap_upvotes`**:
  - `(roadmap_item_id, user_id)`: UNIQUE constraint creates an index. Enforces one vote per user per item and speeds up lookups for a specific user's vote on an item.
  - `(user_id)`: To quickly find all items a user has upvoted.
  - `(roadmap_item_id)`: To quickly find all upvotes for a specific roadmap item (useful for recalculating scores).
- **`alerts`**:
  - `(public_id)`: UNIQUE constraint creates an index.
  - `(user_id, read_at NULLS FIRST, created_at DESC)`: Composite index to efficiently fetch a user's alerts, prioritizing unread ones, then by newest.
  - `(roadmap_item_id)`: To find all alerts related to a specific roadmap item, if needed.
  - `(type)`: If we need to query alerts of a specific type.

### 3.3 SQL Functions & Triggers

1.  **Update `roadmap_items` denormalized metrics on `roadmap_upvotes` change:**

    - **Trigger:** On `INSERT`, `UPDATE (score)`, `DELETE` of `roadmap_upvotes`.
    - **Function:** Recalculates `upvote_count` (COUNT of related `roadmap_upvotes`) and `avg_score` (AVG of `score` from related `roadmap_upvotes`) for the affected `roadmap_item_id` and updates the corresponding row in `roadmap_items`. This keeps the metrics current for efficient querying without real-time aggregation.

2.  **Create `alert` on `roadmap_items.state` change:**

    - **Trigger:** On `UPDATE` of `roadmap_items` IF `OLD.state IS DISTINCT FROM NEW.state`.
    - **Function:**
      1.  Identifies the `creator_user_id` of the `roadmap_item`.
      2.  Identifies all `user_id`s from `roadmap_upvotes` related to this `roadmap_item_id`.
      3.  For each unique user identified (creator + upvoters):
          - Inserts a new row into the `alerts` table.
          - `user_id`: The user to be notified.
          - `type`: 'ROADMAP_ITEM_STATE_CHANGED'.
          - `title`: e.g., "Roadmap Item '[Item Title]' is now [New State]".
          - `description`: e.g., "The roadmap item you created/upvoted, '[Item Title]', has changed status from [Old State] to [New State]."
          - `roadmap_item_id`: The ID of the changed item.
      4.  To prevent alert storms from rapid state "flapping" (e.g., A -> B -> A -> B in quick succession), this function should ideally only insert an alert if a substantively identical alert (same item, user, old_state, new_state) was not created within the last few minutes, or if the `new_state` differs from the `new_state` of the most recent 'ROADMAP_ITEM_STATE_CHANGED' alert for that specific item and user.

3.  **Search `roadmap_items` by title and body:**
    - **SQL Function:** `search_roadmap_items(search_term TEXT)`
      ```sql
      CREATE OR REPLACE FUNCTION search_roadmap_items(search_term TEXT)
      RETURNS SETOF roadmap_items AS $$
        SELECT *
        FROM roadmap_items
        WHERE to_tsvector('english', title || ' ' || body) @@ plainto_tsquery('english', search_term)
        ORDER BY ts_rank(to_tsvector('english', title || ' ' || body), plainto_tsquery('english', search_term)) DESC;
      $$ LANGUAGE sql STABLE;
      ```
    - **Purpose:** Provides a way to search for roadmap items using full-text search capabilities on their `title` and `body`. This can be used in the "Propose New Idea" flow to help users find existing similar items.
    - **Note:** An appropriate GIN index should be created on `to_tsvector('english', title || ' ' || body)` for performance. Example: `CREATE INDEX roadmap_items_search_idx ON roadmap_items USING GIN (to_tsvector('english', title || ' ' || body));`

---

## 4. Permissions & Row-Level Security (RLS)

RLS policies will be implemented in Supabase to enforce data access rules.

1.  **Public (unauthenticated `anon` role):**

    - `roadmap_items`: Can `SELECT` items where `state` IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED').
    - Cannot `INSERT`, `UPDATE`, `DELETE` `roadmap_items`.
    - Cannot access `roadmap_upvotes` or `alerts`.

2.  **Authenticated Users (`authenticated` role):**

    - `roadmap_items`:
      - Can `SELECT` all items.
      - Can `INSERT` new items (policy `WITH CHECK (creator_user_id = auth.uid())`).
      - Can `UPDATE` items they created (`USING (creator_user_id = auth.uid())`), potentially restricted to certain fields (e.g., `title`, `body`) or states (e.g., only if `state` is 'PROPOSED').
    - `roadmap_upvotes`:
      - Can `SELECT` their own upvotes (`USING (user_id = auth.uid())`).
      - Can `INSERT` new upvotes (`WITH CHECK (user_id = auth.uid())`).
      - Can `UPDATE` their own upvotes (score) (`USING (user_id = auth.uid())`).
      - Can `DELETE` their own upvotes (`USING (user_id = auth.uid())`).
    - `alerts`:
      - Can `SELECT` their own alerts (`USING (user_id = auth.uid())`).
      - Can `UPDATE` the `read_at` column for their own alerts (`USING (user_id = auth.uid())`).
      - Cannot `INSERT` or `DELETE` alerts directly (triggers handle inserts).

3.  **Admin/Staff (custom role, e.g., `service_role` or specific admin role):**
    - Full `SELECT`, `INSERT`, `UPDATE`, `DELETE` access to all three tables, bypassing RLS or with permissive RLS.

---

## 5. Front-End

### 5.1 Public Roadmap (Marketing route group)

Located under the `(marketing)` Next.js route group.

```
/roadmap           -- Public list view of items in 'PLANNED', 'IN_PROGRESS', or 'COMPLETED' states.
                     -- Authenticated users will see a "Propose Idea" button leading to ProposeRoadmapItemModal.
```

### 5.2 Studio / Authenticated Area

```
/studio
  └── /alerts      -- Authenticated users' full list of past alerts (read and unread).
```

### 5.3 Key Components / Hooks

```
/components
  RoadmapCard.tsx          -- Displays a single roadmap item.
  VoteWidget.tsx           -- Handles upvoting (1-5 score), disabled for unauthenticated users.
  StatusBadge.tsx          -- Visual indicator for roadmap item state.
  ProposeRoadmapItemModal.tsx -- Modal form for authenticated users to submit new roadmap items.
  AlertsDropdown.tsx       -- Bell icon in main nav; shows recent unread alerts, links to /studio/alerts.
  useConfetti()            -- Hook to trigger confetti effect (e.g., on roadmap item submission).
```

### 5.4 List View (`/roadmap`)

- Displays cards for `roadmap_items` that are `PLANNED`, `IN_PROGRESS`, or `COMPLETED`.
- Ordered by `avg_score DESC` then `upvote_count DESC`.
- Filter options (e.g., by state).
- Each card shows title, truncated body, status, vote count, average score.
- Clicking a card could open a detail modal/page with full description, discussion (future), and vote widget.
- A "Propose New Idea" button is always visible.
  - For authenticated users, it opens `ProposeRoadmapItemModal`.
  - For unauthenticated users, clicking it redirects to the login/signup page.

### 5.5 Submission Flow (via `ProposeRoadmapItemModal`)

1.  User clicks "Propose New Idea". If unauthenticated, they are first redirected to login and then can proceed.
2.  Modal appears (auth check implicitly handled by page/component logic before modal display).
3.  Form for `title` and `body` ("What's your biggest pain point?").
4.  Before submitting, the system can offer to search existing items using the `search_roadmap_items(text)` function based on the entered title/body to prevent duplicates and encourage upvoting.
5.  On successful submission (inserts into `roadmap_items` with state 'PROPOSED'):
    - Trigger `
