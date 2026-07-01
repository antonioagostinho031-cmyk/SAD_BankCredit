/**
 * Reset passwords for all users with role 'cliente'
 *
 * Usage:
 *   node scripts/reset-client-passwords.js
 *   node scripts/reset-client-passwords.js --password "MinhaNovaPass@2024"
 *
 * Defaults to: Cliente@2024
 */

const bcrypt = require('bcrypt')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load .env from backend root
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_URL ou SUPABASE_SERVICE_KEY em falta no .env')
  process.exit(1)
}

// Parse --password argument
const args = process.argv.slice(2)
const pwArgIndex = args.indexOf('--password')
const newPassword = pwArgIndex !== -1 ? args[pwArgIndex + 1] : 'Cliente@2024'

if (!newPassword || newPassword.length < 8) {
  console.error('A senha deve ter pelo menos 8 caracteres.')
  process.exit(1)
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // 1. List all client users
  const { data: clients, error: fetchError } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('role', 'cliente')
    .eq('active', true)
    .order('name')

  if (fetchError) {
    console.error('Erro ao listar clientes:', fetchError.message)
    process.exit(1)
  }

  if (!clients || clients.length === 0) {
    console.log('Nenhum utilizador com role "cliente" encontrado.')
    process.exit(0)
  }

  console.log(`\nClientes encontrados: ${clients.length}`)
  console.log('─'.repeat(60))
  clients.forEach(c => console.log(`  ${c.name.padEnd(35)} ${c.email}`))
  console.log('─'.repeat(60))
  console.log(`\nNova senha: ${newPassword}`)
  console.log('\nA gerar hash bcrypt...')

  // 2. Hash the new password
  const hash = await bcrypt.hash(newPassword, 10)

  // 3. Update all client users at once
  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ password: hash })
    .eq('role', 'cliente')
    .eq('active', true)
    .select('id, name, email')

  if (updateError) {
    console.error('Erro ao actualizar senhas:', updateError.message)
    process.exit(1)
  }

  console.log(`\n✓ Senha redefinida para ${updated.length} cliente(s):`)
  updated.forEach(c => console.log(`  ✓ ${c.name} <${c.email}>`))
  console.log(`\nNova senha: ${newPassword}`)
  console.log('Todos os clientes devem usar esta senha para entrar no portal.\n')
}

main().catch(err => {
  console.error('Erro inesperado:', err.message)
  process.exit(1)
})
