const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

async function fetchData() {
  const { data, error } = await supabaseClient
    .from('table_name')
    .select('*');
  if (error) throw error;
  return data;
}

async function storeData(data) {
  const { data: insertedData, error } = await supabaseClient
    .from('table_name')
    .insert(data);
  if (error) throw error;
  return insertedData;
}

module.exports = { fetchData, storeData };