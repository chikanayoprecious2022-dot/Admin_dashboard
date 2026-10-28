require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function normalizeItem(payload) {
  const owner = String(payload.owner || '').trim();
  const details = String(payload.details || '').trim();
  const status = ['Planned', 'In Progress', 'Done'].includes(payload.status) ? payload.status : 'Planned';

  let title = String(payload.title || '').trim();
  let location = String(payload.location || '').trim();

  if (!owner || !details) {
    throw new Error('Owner and details are required.');
  }

  if (!title) {
    title = `${owner} update`;
  }

  if (!location) {
    location = 'Public board';
  }

  return {
    title,
    location,
    owner,
    details,
    status,
  };
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Public dashboard API is running.' });
});

app.get('/api/items', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Could not fetch items.' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const itemData = normalizeItem(req.body);

    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          title: itemData.title,
          location: itemData.location,
          owner: itemData.owner,
          status: itemData.status,
          details: itemData.details,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Could not create item.' });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const itemData = normalizeItem(req.body);

    const { data, error } = await supabase
      .from('items')
      .update({
        title: itemData.title,
        location: itemData.location,
        owner: itemData.owner,
        status: itemData.status,
        details: itemData.details,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Could not update item.' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('items').delete().eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Item deleted.' });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Could not delete item.' });
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: error.message || 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`Public dashboard API running at http://localhost:${port}`);
});
