/**
 * Script para criar o utilizador administrador inicial
 * Executar com: npx ts-node scripts/create-admin.ts
 *
 * Requer as variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_KEY definidas
 */

import * as bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('ERRO: Configure SUPABASE_URL e SUPABASE_SERVICE_KEY no ficheiro .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const users = [
    { name: 'Administrador Sistema',  email: 'admin@banco.ao',      password: 'Admin@1234',      role: 'admin'      },
    { name: 'Ana Fernanda Lopes',     email: 'ana.lopes@banco.ao',  password: 'Analista@1234',   role: 'analista'   },
    { name: 'Carlos Manuel Teixeira', email: 'c.teixeira@banco.ao', password: 'Gestor@1234',     role: 'gestor'     },
    { name: 'Maria Jose Silva',       email: 'mj.silva@banco.ao',   password: 'Supervisor@1234', role: 'supervisor' },
  ];

  console.log('A criar utilizadores de demonstracao...\n');

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const { data, error } = await supabase
      .from('users')
      .upsert([
        {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          active: true,
        },
      ], { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      console.error(`ERRO ao criar ${user.email}:`, error.message);
    } else {
      console.log(`[OK] ${user.role.padEnd(12)} — ${user.email} / ${user.password}`);
    }
  }

  console.log('\nUtilizadores criados com sucesso.');
  console.log('Execute o ficheiro seed.sql no Supabase para adicionar dados de demonstracao.');
}

main().catch(console.error);
