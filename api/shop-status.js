import fetch from 'node-fetch';

export default async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.kienhuiswintersport.nl');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const baseId = 'appzOtnrRAtoWvbGf';
  const tables = ["Openingstijden", "Sluitingsperiodes", "Specifieke Sluitingsdata"];

  try {
    const requests = tables.map(tableName =>
      fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
        headers: { Authorization: `Bearer ${airtableApiKey}` }
      }).then(response => {
        if (!response.ok) throw new Error(`Failed to fetch ${tableName}`);
        return response.json();
      }).then(data => ({ tableName, records: data.records }))
    );

    const results = await Promise.all(requests);
    const airtableData = results.reduce((acc, current) => {
      acc[current.tableName] = current.records;
      return acc;
    }, {});

    res.status(200).json(airtableData);
  } catch (error) {
    console.error('Fout in Vercel Function:', error);
    res.status(500).json({ error: 'Interne serverfout' });
  }
}
