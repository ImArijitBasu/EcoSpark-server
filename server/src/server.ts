import app from './app';
import { env } from './config/env';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`\n🌿 EcoSpark Hub API Server`);
  console.log(`   ├─ Environment: ${env.NODE_ENV}`);
  console.log(`   ├─ Port: ${PORT}`);
  console.log(`   ├─ API: http://localhost:${PORT}/api`);
  console.log(`   └─ Health: http://localhost:${PORT}/api/health\n`);
});
