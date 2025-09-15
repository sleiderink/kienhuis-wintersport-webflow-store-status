import fetch from 'node-fetch';

export default async function (req, res) {
  const airtableApiKey = process.env.AIRTABLE_API_KEY;
  const baseId = 'appB9GQhuY38AW2uT';
  const requestedPath = req.url;

  // Set CORS headers for all requests to the API route
  res.setHeader('Access-Control-Allow-Origin', 'https://www.kienhuiswintersport.nl');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let airtableData;
    let url;

    // Route based on the requested URL
    if (requestedPath.includes('/api/skis')) {
      url = `https://api.airtable.com/v0/${baseId}/Ski%20Finder`;
    } else if (requestedPath.includes('/api/shop-status')) {
      const tables = ["Openingstijden", "Sluitingsperiodes", "Specifieke Sluitingsdata"];
      
      const requests = tables.map(tableName =>
        fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`, {
          headers: { Authorization: `Bearer ${airtableApiKey}` }
        }).then(response => {
          if (!response.ok) throw new Error(`Failed to fetch ${tableName}`);
          return response.json();
        }).then(data => ({ tableName, records: data.records }))
      );

      const results = await Promise.all(requests);
      airtableData = results.reduce((acc, current) => {
        acc[current.tableName] = current.records;
        return acc;
      }, {});
      
      res.status(200).json(airtableData);
      return;

    } else {
      res.status(404).json({ error: "Endpoint not found" });
      return;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: `Airtable API error: ${errorText}` });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Error in Vercel Function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
