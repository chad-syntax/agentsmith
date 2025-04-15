-- Enable the "pgtap" extension
create extension pgtap with schema extensions;

-- TimescaleDB Extension
create extension if not exists timescaledb schema extensions; 