# Database Setup Instructions

## 1. Run the Initial Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `cpghlbqxamwilhfcvntg`
3. Go to **SQL Editor** in the left sidebar
4. Copy and paste the contents of `migrations/001_initial_schema.sql`
5. Click **RUN** to execute the SQL

## 2. Verify Setup

After running the migration, you should see:

### Tables Created:
- `notes` - Store user notes with content, title, tags
- `conversations` - Store chat conversations
- `messages` - Store individual chat messages

### Features Enabled:
- ✅ **Row Level Security (RLS)** - Users can only access their own data
- ✅ **Realtime subscriptions** - Live sync between desktop and web
- ✅ **Auto-updating timestamps** - `updated_at` automatically updates
- ✅ **Performance indexes** - Fast queries for large datasets

### Test the Setup:
1. Go to **Table Editor** in Supabase dashboard
2. You should see the three tables: `notes`, `conversations`, `messages`
3. Try inserting a test note (you'll need to authenticate first)

## 3. Authentication Setup

Supabase Auth is already configured with your project. The tables reference `auth.users(id)` which is automatically created by Supabase.

## 4. Next Steps

Once the database is set up:
1. Initialize the Next.js web app
2. Set up authentication in the web app
3. Create the CRUD operations for notes and conversations
4. Update the desktop app to sync with Supabase

---

**Database URL**: `https://cpghlbqxamwilhfcvntg.supabase.co`
**Status**: Ready for web app development 🚀