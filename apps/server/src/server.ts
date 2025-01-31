import express from 'express';

const app = express();
const port = process.env.PORT || 3001;

app.get('/', (_req, res) => {
  res.json({ message: 'Cloud People API' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
