insert into roadmap_items (creator_user_id, slug, title, body, state)
values
  (1, 'feature-a', 'Feature A', 'Description for Feature A', 'PROPOSED'),
  (1, 'bug-fix-b', 'Bug Fix B', 'Description for Bug Fix B', 'REJECTED'),
  (1, 'improvement-c', 'Improvement C', 'Description for Improvement C', 'PLANNED'),
  (2, 'feature-d', 'Feature D', 'Description for Feature D', 'IN_PROGRESS'),
  (2, 'task-e', 'Task E', 'Description for Task E', 'CANCELLED'),
  (2, 'feature-f', 'Feature F', 'Description for Feature F', 'COMPLETED'),
  (2, 'feature-g', 'Feature G', 'Description for Feature G', 'PROPOSED');

insert into roadmap_upvotes (roadmap_item_id, user_id, score)
values
  ((select id from roadmap_items where slug = 'feature-a'), 1, 5),
  ((select id from roadmap_items where slug = 'feature-a'), 2, 4),
  ((select id from roadmap_items where slug = 'improvement-c'), 1, 5),
  ((select id from roadmap_items where slug = 'feature-d'), 2, 3),
  ((select id from roadmap_items where slug = 'feature-f'), 1, 5),
  ((select id from roadmap_items where slug = 'feature-f'), 2, 5),
  ((select id from roadmap_items where slug = 'feature-g'), 1, 4),
  ((select id from roadmap_items where slug = 'feature-g'), 2, 3);

-- triggers alert creation
update roadmap_items
set state = 'IN_PROGRESS'
where slug = 'feature-a';
