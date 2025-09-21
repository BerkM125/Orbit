import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uwfnpwmchtnssaejiqep.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3Zm5wd21jaHRuc3NhZWppcWVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzYxNTU4NSwiZXhwIjoyMDczMTkxNTg1fQ.oLxMX8XYEdnEdUZcBw8uNqFShWnkl_4b2zwaow896z0';
const supabase = createClient(supabaseUrl, supabaseKey)

module.exports = { supabase };