-- ============================================================
-- WISER OS — FULL EARNINGS HISTORY SEED
-- Run this in Supabase SQL Editor (after schema is already set up)
-- This replaces all deal data with complete history
-- ============================================================

-- Clear existing deals seed data first
delete from deals;

-- ============================================================
-- HISTORICAL DEALS (pre-2025) — all received
-- ============================================================
insert into deals (brand, agency, deliverables, amount, status, notes, created_at) values

('Roposo', 'Direct', 'Lives 15min x 5hrs/month (8 months)', 200000, 'confirmed', '25k x 8 months', '2022-01-01'),
('Unacademy', 'Direct', '1 Reel', 10000, 'confirmed', null, '2022-06-01'),
('Incomet', 'Direct', '6 Reels/month x 17 months', 425000, 'confirmed', '25k x 17 months', '2022-08-01'),
('Lets Unbound', 'Direct', '2 Reels', 2000, 'confirmed', null, '2022-10-01'),
('CoinEx', 'Direct', '6-month campaign', 108000, 'confirmed', '18-20k/month for 6 months', '2023-01-01'),
('Aviva Life', 'Direct', '1 Reel', 25000, 'confirmed', null, '2023-03-01'),
('Bellavita', 'Direct', '1 Ad Shot', 30000, 'confirmed', null, '2023-04-01'),
('Univest', 'Direct', '3 Ad Shots', 30000, 'confirmed', null, '2023-05-01'),
('Univest', 'Direct', 'Late Campaign Run Fee', 15000, 'confirmed', null, '2023-07-01'),
('Univest', 'Direct', '2 More Ad Shots', 40000, 'confirmed', null, '2023-09-01'),
('Max Life', 'Direct', '1 Ad Shot + 3 Months Ad Rights', 40000, 'confirmed', null, '2023-10-01'),
('Max Life', 'Direct', '2 Ad Shots + 3 Months Ad Rights', 70000, 'confirmed', null, '2024-01-01'),
('Navi Mutual Fund', 'Direct', '1 Ad Shot + 3 Months Ad Rights', 50000, 'confirmed', null, '2024-02-01'),
('HK Vitals', 'Direct', '1 Ad Shot', 30000, 'confirmed', null, '2024-03-01'),
('Max Life', 'Direct', '2 Ad Shots + 3 Months Ad Rights', 70000, 'confirmed', null, '2024-04-01'),
('MyFi', 'Direct', '1 Reel', 25000, 'confirmed', null, '2024-05-01'),
('Aurum Proptech', 'Direct', '1 Reel', 25000, 'confirmed', null, '2024-05-01'),
('Edtech (Digiwhistle)', 'Digiwhistle', '1 Reel', 20000, 'confirmed', null, '2024-06-01'),
('Binance', 'Direct', '1 Reel + 3 Month Digital Rights', 43800, 'confirmed', null, '2024-06-01'),
('One Card', 'Direct', '1 Reel + 1 Month Ad Rights', 22000, 'confirmed', null, '2024-07-01'),
('Wizely', 'Direct', '1 Reel + 1 Month Ad Rights', 22000, 'confirmed', null, '2024-07-01'),
('MyITReturns', 'Direct', '1 Reel', 25000, 'confirmed', null, '2024-08-01'),
('Paisabazaar', 'Direct', '1 Reel', 22000, 'confirmed', null, '2024-08-01'),
('Phillip Capital', 'Direct', '8 Reels + 3 YT + 1 Podcast (6 months)', 237500, 'confirmed', '2.5 months paid - 237500', '2024-09-01'),
('House of Hiranandani', 'Direct', '1 Ad Shot + 3 Month Ad Rights', 40000, 'confirmed', null, '2024-09-01'),
('Yaas x Vi', 'Direct', '24 Reels x 12 Months', 40000, 'confirmed', '40k/month recurring', '2024-10-01'),
('Moneyview', 'Direct', 'Campaign', 6000, 'confirmed', null, '2024-10-01'),
('Scripbox', 'Direct', 'Campaign', 28000, 'confirmed', null, '2024-10-01'),
('Zoop Wallet', 'Direct', 'Campaign', 20000, 'confirmed', null, '2024-10-01'),
('Wegofin', 'Direct', 'Campaign', 30000, 'confirmed', null, '2024-11-01'),
('KukuFM', 'Direct', '2 Video Programs 60min each', 160000, 'confirmed', null, '2024-11-01'),
('Svaraa Diamonds', 'Direct', '1 Reel', 22000, 'confirmed', null, '2024-11-01'),
('13 Karat App', 'Direct', '1 Reel', 22000, 'confirmed', null, '2024-11-01'),
('Ease My Deal', 'Direct', '1 Reel', 25000, 'confirmed', null, '2024-11-01'),
('House of Hiranandani', 'Direct', 'Campaign (2nd)', 40000, 'confirmed', null, '2024-12-01'),
('Uni Card Gold X', 'Direct', 'Campaign', 52000, 'confirmed', null, '2024-12-01');

-- ============================================================
-- OCTOBER–NOVEMBER 2025 (by october block from sheet)
-- ============================================================
insert into deals (brand, agency, deliverables, amount, status, notes, created_at) values
('Brand (Oct 2025 A)', 'Direct', 'Campaign', 120000, 'confirmed', 'Oct 2025 batch', '2025-10-01'),
('Brand (Oct 2025 B)', 'Direct', 'Campaign', 190000, 'confirmed', 'Oct 2025 batch', '2025-10-15'),
('Brand (Oct 2025 C)', 'Direct', 'Campaign', 150000, 'confirmed', 'Oct 2025 batch', '2025-10-20');

-- ============================================================
-- DECEMBER 2025
-- ============================================================
insert into deals (brand, agency, deliverables, amount, status, notes, created_at) values
('Natural Diamond Union', 'Direct', 'Campaign', 25000, 'confirmed', null, '2025-12-01'),
('Wise', 'Direct', 'Campaign', 35000, 'confirmed', null, '2025-12-10'),
('True Balance', 'Direct', 'Campaign', 30000, 'confirmed', null, '2025-12-15'),
('BytePe', 'Direct', 'Campaign', 25000, 'confirmed', null, '2025-12-20'),
('Man Matters (Hair)', 'Opraah FX', '1 Ad Shot + 1 Month Ad Rights', 25000, 'confirmed', '60-day payment term from delivery', '2025-12-02'),
('Man Matters (Shilajit)', 'Opraah FX', '1 Ad Shot + 1 Month Ad Rights', 25000, 'confirmed', '60-day payment term from delivery', '2025-12-02'),
('Phillip Capital', 'Direct', 'Campaign installment', 47500, 'confirmed', null, '2025-12-20'),
('PC Advance', 'Direct', 'Advance payment', 47500, 'confirmed', null, '2025-12-25');

-- ============================================================
-- JANUARY 2026
-- ============================================================
insert into deals (brand, agency, deliverables, amount, status, due_date, notes, created_at) values
('ICICI Prudential MF', 'Madhouse Media', '1 IG Collab Reel + Story + LIB + 1 YT Short', 35000, 'confirmed', '2026-03-17', '60 days from invoice — go-live Jan 16. Payment likely received.', '2026-01-12'),
('True Balance', 'Direct', 'Add-on campaign', 6000, 'confirmed', null, 'Small addon — received', '2026-01-15'),
('Kotak 811', 'Finnet Media', '1 Collab Reel + 3 Months Ad Rights', 50000, 'confirmed', '2026-03-05', '30-45 days from go-live Jan 2026. Payment likely received.', '2026-01-20'),
('Jio Finance', 'Creators Cube', '1 Collab Reel', 30000, 'confirmed', '2026-02-22', 'Payment received — confirmed in email Jan 22', '2026-01-22'),
('Wint Wealth', 'Kinetic', 'Campaign', 25000, 'pending', null, 'Palak - Kinetic. Payment pending.', '2026-01-25');

-- ============================================================
-- APRIL 2026
-- ============================================================
insert into deals (brand, agency, deliverables, amount, status, due_date, notes, created_at, ad_rights_days, ad_rights_start, ad_rights_end) values
('True Balance', 'Direct', 'Extension Campaign', 36000, 'confirmed', null, 'Received', '2026-04-01', 0, null, null),
('Vantara', 'Madhouse Media', '1 Reel', 25000, 'pending', '2026-05-10', 'Payment within 30 days of Apr 10 go-live. Confirmed via email today.', '2026-04-10', 0, null, null),
('Man Matters', 'Opraah FX', 'Extension Campaign', 60000, 'pending', '2026-05-15', '60-day payment term from video delivery', '2026-04-01', 0, null, null),
('Paytm', 'Madhouse Media', '1 Reel', 25000, 'pending', '2026-04-20', '30 days post go-live. Confirmed Mar 7, went live ~Mar 15. Due ~Apr 15.', '2026-04-01', 0, null, null),
('Phillip Capital', 'Direct', 'Final installment', 47500, 'confirmed', null, 'PC Final received', '2026-04-01', 0, null, null),
('Aditya Birla / ABSLI', 'Creators Cube', '1 IG Collab Reel + 1 YT Short', 45000, 'pending', '2026-07-01', '90 working days from go-live invoice. Go-live ~Feb 2026. Due ~Jun-Jul 2026.', '2026-04-01', 0, null, null);

