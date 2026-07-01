const bcrypt = require('bcrypt');

async function gerarHash() {
  const senha = 'senha123';
  const saltRounds = 10;
  
  console.log('Gerando hash para senha:', senha);
  console.log('Salt rounds:', saltRounds);
  console.log('');
  
  const hash = await bcrypt.hash(senha, saltRounds);
  
  console.log('Hash gerado:');
  console.log(hash);
  console.log('');
  
  // Testar se o hash funciona
  const isValid = await bcrypt.compare(senha, hash);
  console.log('Validação do hash:', isValid ? '✓ OK' : '✗ FALHOU');
  console.log('');
  console.log('Use este hash no SQL:');
  console.log(`'${hash}'`);
}

gerarHash().catch(console.error);
