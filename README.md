# Zeloo — Manutenção Residencial Inteligente

## Status do Projeto
✔ Frontend funcionando (Vite + React + TS)  
✔ Supabase configurado (Auth + Database)  
✔ Backend Vercel com API Routes  
✔ Atualização automática de payment_status funcionando  

## Estrutura Importante

### Frontend
- services/supabaseClient.ts → conexão segura com Supabase (anon)

### Backend (Vercel)
- api/ping.ts → teste da API
- api/supabase-health.ts → teste Supabase no backend
- api/admin-set-paid.ts → simula liberação de pagamento (PAID)

## Lógica de Pagamento
- Campo: profiles.payment_status
- Valores esperados: PENDING | PAID

## Observação
- Mercado Pago ainda não integrado
- Webhook será conectado ao admin-set-paid futuramente
