-- Christ Ambassadors Fellowship International
-- Run this script manually in the Supabase SQL editor after reviewing it.
-- It never drops or recreates the existing public.sermons table.
-- The public.admins table and public.is_admin() helper are assumed to exist.

create extension if not exists pgcrypto;

alter table public.sermons
  add column if not exists notes text;

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_date date,
  facebook_url text not null,
  thumbnail_url text,
  is_live_link boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date timestamptz not null,
  location text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.events
  add column if not exists end_at timestamptz,
  add column if not exists is_recurring boolean not null default false,
  add column if not exists recurrence_note text,
  add column if not exists created_at timestamptz not null default now();
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_pinned boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null,
  cover_url text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  album text,
  taken_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  weekday text not null,
  start_time time not null,
  end_time time not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Initial schedule. Replace the two weekday placeholders when confirmed.
insert into public.services (name, weekday, start_time, end_time, sort_order)
select seed.name, seed.weekday, seed.start_time, seed.end_time, seed.sort_order
from (
  values
    ('Bible Study', '[Weekday to be confirmed]', time '17:30', time '19:00', 1),
    ('Prayer Meeting', '[Weekday to be confirmed]', time '17:30', time '19:00', 2),
    ('Sunday School', 'Sunday', time '09:00', time '10:00', 3),
    ('Sunday Service', 'Sunday', time '10:00', time '12:00', 4)
) as seed(name, weekday, start_time, end_time, sort_order)
where not exists (
  select 1 from public.services existing
  where lower(existing.name) = lower(seed.name)
);

create table if not exists public.verses (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  contact text,
  request text not null,
  is_private boolean not null default true,
  constraint prayer_requests_name_length check (char_length(name) <= 100),
  constraint prayer_requests_contact_length check (char_length(contact) <= 200),
  constraint prayer_requests_request_length check (char_length(request) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.testimonies (
  id uuid primary key default gen_random_uuid(),
  name text,
  testimony text not null,
  approved boolean not null default false,
  constraint testimonies_name_length check (char_length(name) <= 100),
  constraint testimonies_text_length check (char_length(testimony) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.first_timers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  how_heard text,
  wants_followup boolean not null default false,
  constraint first_timers_name_length check (char_length(name) <= 100),
  constraint first_timers_phone_length check (char_length(phone) <= 50),
  constraint first_timers_email_length check (char_length(email) <= 254),
  constraint first_timers_how_heard_length check (char_length(how_heard) <= 200),
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  message text not null,
  constraint contact_messages_name_length check (char_length(name) <= 100),
  constraint contact_messages_contact_length check (char_length(contact) <= 200),
  constraint contact_messages_message_length check (char_length(message) <= 2000),
  created_at timestamptz not null default now()
);

-- Add the same form-size guards to pre-existing form tables, without replacing them.
do $constraints$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'prayer_requests_name_length'
      and conrelid = 'public.prayer_requests'::regclass
  ) then
    alter table public.prayer_requests
      add constraint prayer_requests_name_length check (char_length(name) <= 100);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'prayer_requests_contact_length'
      and conrelid = 'public.prayer_requests'::regclass
  ) then
    alter table public.prayer_requests
      add constraint prayer_requests_contact_length check (char_length(contact) <= 200);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'prayer_requests_request_length'
      and conrelid = 'public.prayer_requests'::regclass
  ) then
    alter table public.prayer_requests
      add constraint prayer_requests_request_length check (char_length(request) <= 2000);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'testimonies_name_length'
      and conrelid = 'public.testimonies'::regclass
  ) then
    alter table public.testimonies
      add constraint testimonies_name_length check (char_length(name) <= 100);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'testimonies_text_length'
      and conrelid = 'public.testimonies'::regclass
  ) then
    alter table public.testimonies
      add constraint testimonies_text_length check (char_length(testimony) <= 2000);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'first_timers_name_length'
      and conrelid = 'public.first_timers'::regclass
  ) then
    alter table public.first_timers
      add constraint first_timers_name_length check (char_length(name) <= 100);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'first_timers_phone_length'
      and conrelid = 'public.first_timers'::regclass
  ) then
    alter table public.first_timers
      add constraint first_timers_phone_length check (char_length(phone) <= 50);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'first_timers_email_length'
      and conrelid = 'public.first_timers'::regclass
  ) then
    alter table public.first_timers
      add constraint first_timers_email_length check (char_length(email) <= 254);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'first_timers_how_heard_length'
      and conrelid = 'public.first_timers'::regclass
  ) then
    alter table public.first_timers
      add constraint first_timers_how_heard_length check (char_length(how_heard) <= 200);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'contact_messages_name_length'
      and conrelid = 'public.contact_messages'::regclass
  ) then
    alter table public.contact_messages
      add constraint contact_messages_name_length check (char_length(name) <= 100);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'contact_messages_contact_length'
      and conrelid = 'public.contact_messages'::regclass
  ) then
    alter table public.contact_messages
      add constraint contact_messages_contact_length check (char_length(contact) <= 200);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'contact_messages_message_length'
      and conrelid = 'public.contact_messages'::regclass
  ) then
    alter table public.contact_messages
      add constraint contact_messages_message_length check (char_length(message) <= 2000);
  end if;
end
$constraints$;

-- Seed well-known King James Version passages. Add more references as desired,
-- up to one verse per day of the year. Existing verse edits are left untouched.
insert into public.verses (reference, text) values
  ('Genesis 1:1', 'In the beginning God created the heaven and the earth.'),
  ('Deuteronomy 31:6', 'Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.'),
  ('Joshua 1:9', 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.'),
  ('1 Samuel 16:7', 'For man looketh on the outward appearance, but the LORD looketh on the heart.'),
  ('2 Chronicles 7:14', 'If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven, and will forgive their sin, and will heal their land.'),
  ('Psalm 23:1', 'The LORD is my shepherd; I shall not want.'),
  ('Psalm 23:4', 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.'),
  ('Psalm 27:1', 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?'),
  ('Psalm 34:8', 'O taste and see that the LORD is good: blessed is the man that trusteth in him.'),
  ('Psalm 37:4', 'Delight thyself also in the LORD; and he shall give thee the desires of thine heart.'),
  ('Psalm 46:1', 'God is our refuge and strength, a very present help in trouble.'),
  ('Psalm 51:10', 'Create in me a clean heart, O God; and renew a right spirit within me.'),
  ('Psalm 55:22', 'Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved.'),
  ('Psalm 91:1', 'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.'),
  ('Psalm 100:4', 'Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.'),
  ('Psalm 119:105', 'Thy word is a lamp unto my feet, and a light unto my path.'),
  ('Psalm 121:1-2', 'I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the LORD, which made heaven and earth.'),
  ('Psalm 139:14', 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.'),
  ('Proverbs 3:5-6', 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.'),
  ('Proverbs 16:3', 'Commit thy works unto the LORD, and thy thoughts shall be established.'),
  ('Proverbs 18:10', 'The name of the LORD is a strong tower: the righteous runneth into it, and is safe.'),
  ('Isaiah 9:6', 'For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace.'),
  ('Isaiah 26:3', 'Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.'),
  ('Isaiah 40:31', 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.'),
  ('Isaiah 41:10', 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.'),
  ('Isaiah 43:2', 'When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee.'),
  ('Isaiah 53:5', 'But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.'),
  ('Jeremiah 29:11', 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.'),
  ('Jeremiah 33:3', 'Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.'),
  ('Lamentations 3:22-23', 'It is of the LORD''S mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.'),
  ('Micah 6:8', 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?'),
  ('Nahum 1:7', 'The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.'),
  ('Matthew 5:14', 'Ye are the light of the world. A city that is set on an hill cannot be hid.'),
  ('Matthew 6:33', 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.'),
  ('Matthew 11:28', 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.'),
  ('Matthew 22:37', 'Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind.'),
  ('Matthew 28:19-20', 'Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost: Teaching them to observe all things whatsoever I have commanded you.'),
  ('Mark 10:27', 'With men it is impossible, but not with God: for with God all things are possible.'),
  ('Luke 1:37', 'For with God nothing shall be impossible.'),
  ('Luke 6:31', 'And as ye would that men should do to you, do ye also to them likewise.'),
  ('John 1:1', 'In the beginning was the Word, and the Word was with God, and the Word was God.'),
  ('John 3:16', 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'),
  ('John 8:12', 'I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.'),
  ('John 10:10', 'I am come that they might have life, and that they might have it more abundantly.'),
  ('John 11:25', 'I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live.'),
  ('John 14:6', 'I am the way, the truth, and the life: no man cometh unto the Father, but by me.'),
  ('John 14:27', 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.'),
  ('John 15:5', 'I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.'),
  ('John 16:33', 'In the world ye shall have tribulation: but be of good cheer; I have overcome the world.'),
  ('Acts 1:8', 'But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me.'),
  ('Romans 3:23', 'For all have sinned, and come short of the glory of God.'),
  ('Romans 5:8', 'But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.'),
  ('Romans 6:23', 'For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.'),
  ('Romans 8:1', 'There is therefore now no condemnation to them which are in Christ Jesus.'),
  ('Romans 8:28', 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.'),
  ('Romans 8:31', 'If God be for us, who can be against us?'),
  ('Romans 8:38-39', 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.'),
  ('Romans 10:9', 'That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.'),
  ('Romans 12:2', 'And be not conformed to this world: but be ye transformed by the renewing of your mind.'),
  ('Romans 15:13', 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.'),
  ('1 Corinthians 10:13', 'God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape.'),
  ('1 Corinthians 13:4', 'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.'),
  ('1 Corinthians 15:58', 'Therefore, my beloved brethren, be ye stedfast, unmoveable, always abounding in the work of the Lord.'),
  ('2 Corinthians 5:17', 'If any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.'),
  ('2 Corinthians 5:21', 'For he hath made him to be sin for us, who knew no sin; that we might be made the righteousness of God in him.'),
  ('2 Corinthians 12:9', 'My grace is sufficient for thee: for my strength is made perfect in weakness.'),
  ('Galatians 5:22-23', 'The fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance.'),
  ('Ephesians 2:8-9', 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.'),
  ('Ephesians 3:20', 'Now unto him that is able to do exceeding abundantly above all that we ask or think, according to the power that worketh in us.'),
  ('Ephesians 6:10', 'Finally, my brethren, be strong in the Lord, and in the power of his might.'),
  ('Philippians 4:6-7', 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.'),
  ('Philippians 4:13', 'I can do all things through Christ which strengtheneth me.'),
  ('Colossians 3:23', 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.'),
  ('1 Thessalonians 5:16-18', 'Rejoice evermore. Pray without ceasing. In every thing give thanks: for this is the will of God in Christ Jesus concerning you.'),
  ('2 Timothy 1:7', 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.'),
  ('Hebrews 4:16', 'Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.'),
  ('Hebrews 11:1', 'Now faith is the substance of things hoped for, the evidence of things not seen.'),
  ('Hebrews 12:2', 'Looking unto Jesus the author and finisher of our faith.'),
  ('Hebrews 13:5', 'I will never leave thee, nor forsake thee.'),
  ('James 1:5', 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.'),
  ('James 1:17', 'Every good gift and every perfect gift is from above, and cometh down from the Father of lights.'),
  ('James 4:7', 'Submit yourselves therefore to God. Resist the devil, and he will flee from you.'),
  ('1 Peter 5:7', 'Casting all your care upon him; for he careth for you.'),
  ('1 John 1:9', 'If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.'),
  ('1 John 4:7', 'Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God.'),
  ('Revelation 21:4', 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain.')
on conflict (reference) do nothing;

-- Enable RLS on every application table, including the existing admin list.
alter table public.sermons enable row level security;
alter table public.videos enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
alter table public.posts enable row level security;
alter table public.gallery enable row level security;
alter table public.services enable row level security;
alter table public.verses enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.testimonies enable row level security;
alter table public.first_timers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.admins enable row level security;

-- Remove this script's named policies first so it can safely be run again.
drop policy if exists "Public can read sermons" on public.sermons;
drop policy if exists "Admins manage sermons" on public.sermons;
drop policy if exists "Public can read videos" on public.videos;
drop policy if exists "Admins manage videos" on public.videos;
drop policy if exists "Public can read events" on public.events;
drop policy if exists "Admins manage events" on public.events;
drop policy if exists "Public can read active announcements" on public.announcements;
drop policy if exists "Admins manage announcements" on public.announcements;
drop policy if exists "Public can read published posts" on public.posts;
drop policy if exists "Admins manage posts" on public.posts;
drop policy if exists "Public can read gallery" on public.gallery;
drop policy if exists "Admins manage gallery" on public.gallery;
drop policy if exists "Public can read services" on public.services;
drop policy if exists "Admins manage services" on public.services;
drop policy if exists "Public can read verses" on public.verses;
drop policy if exists "Admins manage verses" on public.verses;
drop policy if exists "Admins read prayer requests" on public.prayer_requests;
drop policy if exists "Admins manage prayer requests" on public.prayer_requests;
drop policy if exists "Public can submit prayer requests" on public.prayer_requests;
drop policy if exists "Public can read approved testimonies" on public.testimonies;
drop policy if exists "Public can submit testimonies" on public.testimonies;
drop policy if exists "Admins manage testimonies" on public.testimonies;
drop policy if exists "Admins read first timers" on public.first_timers;
drop policy if exists "Admins manage first timers" on public.first_timers;
drop policy if exists "Public can submit first timers" on public.first_timers;
drop policy if exists "Admins read contact messages" on public.contact_messages;
drop policy if exists "Admins manage contact messages" on public.contact_messages;
drop policy if exists "Public can submit contact messages" on public.contact_messages;
drop policy if exists "Users can read own admin row" on public.admins;

-- Public reads are allowed only for the published/public-facing content.
create policy "Public can read sermons"
  on public.sermons for select to anon, authenticated using (true);
create policy "Public can read videos"
  on public.videos for select to anon, authenticated using (true);
create policy "Public can read events"
  on public.events for select to anon, authenticated using (true);
create policy "Public can read active announcements"
  on public.announcements for select to anon, authenticated
  using (expires_at is null or expires_at > now());
create policy "Public can read published posts"
  on public.posts for select to anon, authenticated using (published = true);
create policy "Public can read gallery"
  on public.gallery for select to anon, authenticated using (true);
create policy "Public can read services"
  on public.services for select to anon, authenticated using (true);
create policy "Public can read verses"
  on public.verses for select to anon, authenticated using (true);
create policy "Public can read approved testimonies"
  on public.testimonies for select to anon, authenticated using (approved = true);

-- Public submissions are insert-only. The public cannot read back private form rows.
create policy "Public can submit prayer requests"
  on public.prayer_requests for insert to anon
  with check (is_private = true);
create policy "Admins read prayer requests"
  on public.prayer_requests for select to authenticated using (public.is_admin());
create policy "Admins manage prayer requests"
  on public.prayer_requests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Public can submit testimonies"
  on public.testimonies for insert to anon
  with check (approved = false);
create policy "Admins manage testimonies"
  on public.testimonies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Public can submit first timers"
  on public.first_timers for insert to anon with check (true);
create policy "Admins read first timers"
  on public.first_timers for select to authenticated using (public.is_admin());
create policy "Admins manage first timers"
  on public.first_timers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Public can submit contact messages"
  on public.contact_messages for insert to anon with check (true);
create policy "Admins read contact messages"
  on public.contact_messages for select to authenticated using (public.is_admin());
create policy "Admins manage contact messages"
  on public.contact_messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Admins can manage all content. Public write policies above are limited to
-- private form inserts and unapproved testimony submissions.
create policy "Admins manage sermons"
  on public.sermons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage videos"
  on public.videos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage events"
  on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage announcements"
  on public.announcements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage posts"
  on public.posts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage gallery"
  on public.gallery for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage services"
  on public.services for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage verses"
  on public.verses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- A signed-in admin may confirm their own admin-list entry; no client may edit it.
create policy "Users can read own admin row"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

-- Explicit SQL privileges complement RLS: anon gets only the form INSERT grants below.
revoke all on table
  public.sermons, public.videos, public.events, public.announcements,
  public.posts, public.gallery, public.services, public.verses,
  public.prayer_requests, public.testimonies, public.first_timers,
  public.contact_messages, public.admins
from anon;

grant select on table
  public.sermons, public.videos, public.events, public.announcements,
  public.posts, public.gallery, public.services, public.verses,
  public.testimonies
to anon;
grant insert on table
  public.prayer_requests, public.testimonies, public.first_timers,
  public.contact_messages
to anon;

revoke all on table
  public.sermons, public.videos, public.events, public.announcements,
  public.posts, public.gallery, public.services, public.verses,
  public.prayer_requests, public.testimonies, public.first_timers,
  public.contact_messages, public.admins
from authenticated;

grant select, insert, update, delete on table
  public.sermons, public.videos, public.events, public.announcements,
  public.posts, public.gallery, public.services, public.verses,
  public.prayer_requests, public.testimonies, public.first_timers,
  public.contact_messages
to authenticated;
grant select on table public.admins to authenticated;

-- Increment the existing sermon download counter by exactly one.
-- Callers provide only the sermon ID, never a counter value.
create or replace function public.increment_downloads(row_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.sermons
  set downloads = coalesce(downloads, 0) + 1
  where id = row_id;
$$;

revoke all on function public.increment_downloads(uuid) from public;
grant execute on function public.increment_downloads(uuid) to anon, authenticated;

-- Keep the existing public sermon buckets; never create replacement audio buckets.
-- Mark them publicly readable while storage policies below keep writes admin-only.
update storage.buckets
set public = true
where id in ('sermons-audio', 'thumbnails');

-- The images bucket is for gallery, blog and event artwork only.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read sermon audio objects" on storage.objects;
drop policy if exists "Public can read sermon thumbnails" on storage.objects;
drop policy if exists "Public can read site images" on storage.objects;
drop policy if exists "Admins read site media" on storage.objects;
drop policy if exists "Admins upload site media" on storage.objects;
drop policy if exists "Admins update site media" on storage.objects;
drop policy if exists "Admins delete site media" on storage.objects;

create policy "Admins read site media"
  on storage.objects for select to authenticated
  using (
    public.is_admin()
    and bucket_id in ('sermons-audio', 'thumbnails', 'images')
  );

create policy "Admins upload site media"
  on storage.objects for insert to authenticated
  with check (
    public.is_admin()
    and bucket_id in ('sermons-audio', 'thumbnails', 'images')
  );
create policy "Admins update site media"
  on storage.objects for update to authenticated
  using (
    public.is_admin()
    and bucket_id in ('sermons-audio', 'thumbnails', 'images')
  )
  with check (
    public.is_admin()
    and bucket_id in ('sermons-audio', 'thumbnails', 'images')
  );
create policy "Admins delete site media"
  on storage.objects for delete to authenticated
  using (
    public.is_admin()
    and bucket_id in ('sermons-audio', 'thumbnails', 'images')
  );

-- Already applied in Supabase; included here to keep the repository in sync.
-- Like counter on each sermon
alter table public.sermons
  add column if not exists likes integer not null default 0;

-- One row per device per sermon; the public cannot read or write this table directly
create table if not exists public.sermon_likes (
  sermon_id uuid not null references public.sermons(id) on delete cascade,
  device_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (sermon_id, device_id)
);

alter table public.sermon_likes enable row level security;
revoke all on table public.sermon_likes from anon, authenticated;

-- Like: add this device's like once, recount, return the new total
create or replace function public.like_sermon(p_sermon_id uuid, p_device_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare new_count integer;
begin
  insert into public.sermon_likes (sermon_id, device_id)
  values (p_sermon_id, p_device_id)
  on conflict do nothing;

  update public.sermons s
  set likes = (select count(*) from public.sermon_likes l where l.sermon_id = s.id)
  where s.id = p_sermon_id
  returning s.likes into new_count;

  return coalesce(new_count, 0);
end $$;

-- Unlike: remove this device's like, recount, return the new total
create or replace function public.unlike_sermon(p_sermon_id uuid, p_device_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare new_count integer;
begin
  delete from public.sermon_likes
  where sermon_id = p_sermon_id and device_id = p_device_id;

  update public.sermons s
  set likes = (select count(*) from public.sermon_likes l where l.sermon_id = s.id)
  where s.id = p_sermon_id
  returning s.likes into new_count;

  return coalesce(new_count, 0);
end $$;

revoke all on function public.like_sermon(uuid, uuid) from public;
revoke all on function public.unlike_sermon(uuid, uuid) from public;
grant execute on function public.like_sermon(uuid, uuid) to anon, authenticated;
grant execute on function public.unlike_sermon(uuid, uuid) to anon, authenticated;
