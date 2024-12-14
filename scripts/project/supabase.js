import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabaseUrl = 'https://urebdxgdosfsjdavtucz.supabase.co'; // Замените на ваш URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyZWJkeGdkb3Nmc2pkYXZ0dWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMTE0MDEsImV4cCI6MjA0OTY4NzQwMX0.96VuKwdvTX4-9IlFbOvrAXfhV3YsjK1I5onjWdz2Bks'; // Замените на ваш Anon Key
export const supabase = createClient(supabaseUrl, supabaseKey);