process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.LOG_LEVEL = 'silent';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/bookleaf-test';
process.env.JWT_SECRET = 'test-secret-please-change';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN =
  'http://localhost:5173,https://book-leaf-2u53y3rgi-aryan-kumars-projects-38c41021.vercel.app';
process.env.GROQ_API_KEY = '';
process.env.GROQ_CLASSIFY_MODEL = 'openai/gpt-oss-20b';
process.env.GROQ_DRAFT_MODEL = 'openai/gpt-oss-120b';
process.env.AI_TIMEOUT_MS = '15000';
