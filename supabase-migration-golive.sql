-- Add go_live_date and payment_days to deals table
-- Run this in Supabase SQL Editor

alter table deals
  add column if not exists go_live_date date,
  add column if not exists payment_days integer default 30,
  add column if not exists go_live_link text;

-- Update recent pending deals with correct payment_days from confirmed emails
update deals set payment_days = 45 where brand = 'Kotak 811';
update deals set payment_days = 60 where brand like 'ICICI Prudential%';
update deals set payment_days = 30 where brand = 'Jio Finance';
update deals set payment_days = 30 where brand = 'Paytm' and created_at > '2026-01-01';
update deals set payment_days = 30 where brand = 'Vantara';
update deals set payment_days = 60 where brand like 'Man Matters%';
update deals set payment_days = 90 where brand like 'Aditya Birla%';
update deals set payment_days = 30 where brand = 'Wint Wealth';

-- Mark Jan deals that we know went live
update deals set go_live_date = '2026-01-22', status = 'confirmed' where brand = 'Jio Finance';
update deals set go_live_date = '2026-01-16', status = 'confirmed' where brand like 'ICICI Prudential%';

