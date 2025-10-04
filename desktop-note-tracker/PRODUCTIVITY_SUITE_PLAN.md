# Desktop Note Tracker → Web Productivity Suite (MVP)

## **Tech Stack Decision: Supabase**
✅ **Perfect choice!** Supabase provides:
- PostgreSQL database with real-time subscriptions
- Built-in authentication (email/password)
- Auto-generated REST APIs
- Real-time sync out of the box
- Row Level Security (RLS) for data protection

## **MVP Phase 1: Simple & Working**

### **Backend Setup (Supabase)**
1. **Database Schema**:
   ```sql
   -- users (handled by Supabase Auth automatically)

   -- notes table
   CREATE TABLE notes (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
     content text NOT NULL,
     title text,
     tags text[] DEFAULT '{}',
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
     updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   -- conversations table
   CREATE TABLE conversations (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
     updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
   );

   -- messages table
   CREATE TABLE messages (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
     role text NOT NULL CHECK (role IN ('user', 'assistant')),
     content text NOT NULL,
     timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
   );
   ```

2. **Row Level Security**: Users only see their own data
3. **Real-time subscriptions**: Live sync between desktop/web

### **Web Application (Next.js)**
1. **Simple login page** (email/password only)
2. **Dashboard**: List of notes + recent conversations
3. **Notes page**: Create, edit, delete notes
4. **Chat page**: AI conversations with note context
5. **Basic responsive design** matching desktop aesthetics

### **Desktop App Updates**
1. **Add login screen** before main app
2. **Replace electron-store** with Supabase client
3. **Sync notes/conversations** to cloud
4. **Offline mode**: Cache locally, sync when online

### **Core Features (MVP)**
- ✅ User authentication (simple email/password)
- ✅ Notes CRUD (create, read, update, delete)
- ✅ AI chat with note context
- ✅ Real-time sync between desktop/web
- ✅ Basic search and filtering
- ✅ Export functionality

### **Implementation Order**
1. Set up Supabase project + database schema
2. Create Next.js web app with authentication
3. Build basic notes and chat interfaces
4. Update desktop app for cloud sync
5. Test synchronization between platforms
6. Deploy web app and test end-to-end

**Goal**: Get a working MVP where users can seamlessly switch between desktop app and web interface with all data synchronized in real-time.

**Next Enhancement Waves**: Tags/folders, collaboration, advanced AI features, mobile app, etc.

Keep it simple, get it working, then iterate! 🚀

## **Progress Tracking**

### **Phase 1: Foundation** ✅
- [x] Supabase project setup
- [x] Database schema creation
- [x] RLS policies implementation
- [x] Next.js web app scaffolding
- [x] Basic authentication flow

### **Phase 2: Core Features** ✅
- [x] Authentication pages (login/signup)
- [x] Notes CRUD operations (full create, read, update, delete)
- [x] Chat interface (with Claude AI integration)
- [x] Real-time synchronization (via Supabase)
- [ ] Desktop app cloud integration

### **Phase 3: Polish & Deploy** 🚀
- [ ] UI/UX refinements
- [ ] Error handling
- [ ] Performance optimization
- [ ] Production deployment

## **Next Steps**

### **To Run the SQL Schema:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `cpghlbqxamwilhfcvntg`
3. Go to **SQL Editor**
4. Copy and paste the contents of `database/migrations/001_initial_schema.sql`
5. Click **RUN** to execute

### **To Test the Web App:**
```bash
cd web
npm run dev
```
Then visit: http://localhost:3000

### **Current Status:**
- ✅ Database schema ready
- ✅ Web app foundation complete
- ✅ Authentication system working
- ✅ Notes interface and dashboard complete
- ✅ Chat interface with Claude AI complete
- 🚧 Next: Desktop app cloud integration

---

**Last Updated**: October 4, 2024
**Status**: Phase 1 Complete, Starting Phase 2 🎯