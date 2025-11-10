import { createClient } from '@supabase/supabase-js';

// TODO: Em uma aplicação de produção, estas variáveis devem ser armazenadas em variáveis de ambiente.
const supabaseUrl = 'https://pmceyiaszharxurkcxfo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtY2V5aWFzemhhcnh1cmtjeGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MzkwMzIsImV4cCI6MjA3ODMxNTAzMn0.BL0SjkBTy1AwgIfvhc2MiC7v9ruOqoCcpFelZtqxI28';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
