-- Create Enum for Roles
CREATE TYPE user_role AS ENUM ('citizen', 'officer');

-- Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'citizen',
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect profiles with RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE((new.raw_user_meta_data->>'role')::user_role, 'citizen'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create Complaint Status Enum
CREATE TYPE complaint_status AS ENUM ('pending', 'investigating', 'resolved');

-- Create Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect complaints with RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citizens can insert their own complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Citizens select own, officers select all" ON public.complaints FOR SELECT USING (
  auth.uid() = citizen_id OR 
  EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'officer')
);

CREATE POLICY "Officers can update complaints" ON public.complaints FOR UPDATE USING (
  EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'officer')
);
