import { seedCronogramaOficial } from '../src/lib/seedCronograma';

// Permitir rodar direto via linha de comando
if (require.main === module) {
  seedCronogramaOficial()
    .then(() => {
      console.log('🏁 Script seed_cronograma finalizado!');
      process.exit(0);
    })
    .catch((e) => {
      console.error('❌ Falha na execução do seed_cronograma:', e);
      process.exit(1);
    });
}
