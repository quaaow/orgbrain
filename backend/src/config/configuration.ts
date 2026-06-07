export interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  databaseUrl: string;
  qdrantUrl: string;
  qdrantApiKey: string;
  openrouterApiKey: string;
  chatModel: string;
  embeddingModel: string;
  appEnv: string;
  secretKey: string;
  port: number;
}

export default (): AppConfig => ({
  supabaseUrl: process.env.SUPABASE_URL as string,
  supabaseKey: process.env.SUPABASE_KEY as string,
  databaseUrl: process.env.DATABASE_URL as string,
  qdrantUrl: process.env.QDRANT_URL as string,
  qdrantApiKey: process.env.QDRANT_API_KEY as string,
  openrouterApiKey: process.env.OPENROUTER_API_KEY as string,
  chatModel: process.env.CHAT_MODEL ?? 'deepseek/deepseek-chat:free',
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'local',
  appEnv: process.env.APP_ENV ?? 'development',
  secretKey: process.env.SECRET_KEY as string,
  port: parseInt(process.env.PORT ?? '8000', 10),
});
