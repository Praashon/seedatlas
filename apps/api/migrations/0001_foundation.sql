-- Schema foundation only. No private resource API is exposed in this release.
BEGIN;
CREATE TABLE users (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL CHECK (length(display_name) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE worlds (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  seed_decimal TEXT NOT NULL CHECK (seed_decimal ~ '^-?[0-9]{1,19}$' AND seed_decimal::numeric BETWEEN -9223372036854775808 AND 9223372036854775807),
  minecraft_version TEXT NOT NULL,
  preset TEXT NOT NULL DEFAULT 'default',
  revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id, owner_user_id)
);
CREATE INDEX worlds_owner ON worlds(owner_user_id);
CREATE TABLE waypoints (
  id UUID PRIMARY KEY,
  world_id UUID NOT NULL,
  owner_user_id UUID NOT NULL,
  dimension_id TEXT NOT NULL CHECK (dimension_id IN ('overworld','nether','end')),
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  x INTEGER NOT NULL CHECK (abs(x::bigint) <= 29990000),
  y INTEGER NOT NULL CHECK (y BETWEEN -64 AND 319),
  z INTEGER NOT NULL CHECK (abs(z::bigint) <= 29990000),
  CHECK (dimension_id = 'overworld' OR y BETWEEN 0 AND 255),
  FOREIGN KEY(world_id, owner_user_id) REFERENCES worlds(id, owner_user_id) ON DELETE CASCADE
);
CREATE INDEX waypoints_world_dimension ON waypoints(world_id, dimension_id, x, z);
CREATE TABLE discovery_progress (
  id UUID PRIMARY KEY,
  world_id UUID NOT NULL,
  owner_user_id UUID NOT NULL,
  discovery_key TEXT NOT NULL,
  dimension_id TEXT NOT NULL CHECK (dimension_id IN ('overworld','nether','end')),
  status TEXT NOT NULL CHECK (status IN ('unvisited','planned','in-progress','explored','mined','skipped','not-found','needs-reverification')),
  revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(world_id, owner_user_id, dimension_id, discovery_key),
  FOREIGN KEY(world_id, owner_user_id) REFERENCES worlds(id, owner_user_id) ON DELETE CASCADE
);
CREATE TABLE sync_events (
  client_event_id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  world_id UUID NOT NULL,
  expected_revision BIGINT NOT NULL CHECK (expected_revision >= 0),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY(world_id, owner_user_id) REFERENCES worlds(id, owner_user_id) ON DELETE CASCADE
);
COMMIT;
