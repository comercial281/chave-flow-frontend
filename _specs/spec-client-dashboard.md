---
title: 'Dashboard de Uso e Saúde por Cliente (Clientes CRM)'
type: 'feature'
created: '2026-06-14'
status: 'in-progress'
baseline_backend: 'a78a497'
baseline_frontend: '291fae5'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A página Clientes CRM lista os tenants mas não mostra saúde, uso real nem custo por cliente. Giovani não tem como saber se um cliente está com Evolution desconectado, backend fora do ar, ou quanto cada um custa na infra.

**Approach:** Adicionar snapshot diário de métricas por tenant (backend health, Evolution status, usage counts, custo Railway estimado), uma aba "Dashboard" na página existente com cards por cliente e visão geral agregada, e suporte a arquivar/desarquivar clientes.

## Boundaries & Constraints

**Always:**
- Só super-admin (`comercial@lealmidia.com.br`) acessa a página — gate já existe no frontend e backend, manter.
- Snapshots coletados uma vez por dia via Sidekiq job no master backend; UI consome o snapshot mais recente (não faz chamadas em tempo real a Railway/Evolution a cada load).
- Novos tenants criados via `ProvisionClientInstanceJob` devem ter snapshot criado automaticamente logo após `status = active`.
- Custo estimado = custo Railway do projeto do tenant (Railway GraphQL API com token do super-admin) + rateio da Evolution (custo fixo R$160/mês ÷ proporcional de mensagens do tenant vs total).
- Envelop padrão LM Flow: `{ success, data, message }` em todas as responses novas.

**Ask First:**
- Se o Railway token não estiver configurado como env var (`RAILWAY_API_TOKEN`), o campo de custo deve aparecer como `–` sem quebrar o job.
- Se tenant `backend_url` estiver inacessível, marcar `backend_reachable: false` e continuar — não falhar o job inteiro.

**Never:**
- Não deletar o tenant ao arquivar — só setar `archived_at`.
- Não chamar Railway/Evolution diretamente do frontend.
- Não usar `wa_messages` (tabela não existe) — o tenant metrics endpoint usa `whatsapp_messages`.
- Não quebrar o fluxo existente de lista/provisioning/SSO/Membros/Funções.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tenant ativo com backend up | `backend_url` acessível | `backend_reachable: true`, métricas populadas | — |
| Tenant com backend down | `backend_url` timeout/5xx | `backend_reachable: false`, demais campos `null` | Job não falha; log erro |
| Railway token ausente | `RAILWAY_API_TOKEN` não setado | `railway_monthly_cost: null` no snapshot | Custo aparece como `–` na UI |
| Novo tenant criado | `status` muda para `active` | `SyncClientMetricsJob.perform_later(id)` disparado | — |
| Arquivar cliente | `PATCH /client_instances/:id/archive` | `archived_at` setado; some da lista principal | Aparecer em filtro "Arquivados" |
| Dashboard geral | Vários tenants com snapshots | Card "Visão Geral": soma de custo, média de saúde, totais de uso | Se 0 snapshots, mostrar `–` |

</frozen-after-approval>

## Code Map

### Master backend (`lm-flow-rails`)
- `app/models/client_instance.rb` — modelo principal; recebe `archived_at` e association `has_many :client_instance_snapshots`
- `app/models/client_instance_snapshot.rb` — **NOVO** modelo de snapshot diário
- `db/migrate/TIMESTAMP_add_archived_at_to_client_instances.rb` — **NOVA** migration: `archived_at datetime`
- `db/migrate/TIMESTAMP_create_client_instance_snapshots.rb` — **NOVA** migration: tabela de snapshots
- `app/jobs/sync_client_metrics_job.rb` — **NOVO** Sidekiq job diário
- `app/controllers/api/v1/client_instances_controller.rb` — adicionar `archive`, `unarchive`, `dashboard` actions
- `config/routes.rb` — novas rotas: `member { post :archive; post :unarchive }`, `collection { get :dashboard }`

### Tenant backend (`lm-flow-rails` — roda em cada tenant)
- `app/controllers/api/v1/super/metrics_controller.rb` — **NOVO** endpoint restrito ao super-admin
- `config/routes.rb` (tenant) — rota `namespace :super { get :metrics }`

### Frontend (`lm-flow-frontend`)
- `src/pages/SuperAdmin/ClientInstances/index.tsx` — adicionar tab "Dashboard" / "Lista", botão arquivar, filtro "Arquivados"
- `src/pages/SuperAdmin/ClientInstances/DashboardView.tsx` — **NOVO** componente: cards por cliente + card visão geral
- `src/pages/SuperAdmin/ClientInstances/ClientMetricCard.tsx` — **NOVO** card individual com badges de saúde, barras de uso, custo
- `src/services/clientInstances/clientInstancesService.ts` — adicionar `archive()`, `unarchive()`, `dashboard()`

## Tasks & Acceptance

**Execution:**

- [ ] `db/migrate/TIMESTAMP_add_archived_at_to_client_instances.rb` -- add column `archived_at :datetime, null: true` -- suporte a arquivar sem deletar
- [ ] `db/migrate/TIMESTAMP_create_client_instance_snapshots.rb` -- criar tabela `client_instance_snapshots` com colunas: `client_instance_id:bigint FK`, `date:date`, `backend_reachable:boolean`, `evolution_connected:boolean`, `leads_count:integer`, `conversations_count:integer`, `messages_count:integer`, `inboxes_count:integer`, `railway_monthly_cost_cents:integer`, `raw_json:jsonb`; índice único em `(client_instance_id, date)` -- armazenar snapshot por dia
- [ ] `app/models/client_instance_snapshot.rb` -- belongs_to :client_instance; scope :latest (order date desc) -- modelo de snapshot
- [ ] `app/models/client_instance.rb` -- add `has_many :client_instance_snapshots, dependent: :destroy`; scope `:active` (`where(archived_at: nil)`); scope `:archived` -- extender modelo
- [ ] `app/controllers/api/v1/super/metrics_controller.rb` (TENANT) -- action `index`: retornar `{leads_count, conversations_count, messages_count (from whatsapp_messages), inboxes_count, evolution_connected (via Inbox Channel conectado)}` autenticado com `require_super_admin` -- endpoint de métricas por tenant
- [ ] `config/routes.rb` (TENANT) -- adicionar `namespace :super { resources :metrics, only: [:index] }` sob `api/v1` -- rotear endpoint de métricas
- [ ] `app/jobs/sync_client_metrics_job.rb` -- job que para cada `ClientInstance.active` (1) faz HTTP GET `{backend_url}/api/v1/super/metrics` com basic auth super-admin, (2) chama Railway GraphQL API para custo mensal do `railway_project_id`, (3) faz upsert em `client_instance_snapshots` com `date: Date.today` -- coletar métricas diárias; após `status = active` em `ProvisionClientInstanceJob`, enfileirar este job
- [ ] `app/controllers/api/v1/client_instances_controller.rb` -- actions `archive` / `unarchive` (set/clear `archived_at`); action `dashboard` retorna todos os tenants não-arquivados + snapshot mais recente de cada + agregados (total custo, % saúde, totais de uso) -- novas actions do master
- [ ] `config/routes.rb` (MASTER) -- `member { post :archive; post :unarchive }`, `collection { get :dashboard }` -- rotas novas
- [ ] `src/services/clientInstances/clientInstancesService.ts` -- adicionar `archive(id)`, `unarchive(id)`, `dashboard()` -- chamadas novas
- [ ] `src/pages/SuperAdmin/ClientInstances/ClientMetricCard.tsx` -- card com: nome do tenant, badges (backend, Evolution), barras de uso (mensagens, leads, conversas), custo mensal formatado em R$, data do último snapshot, botão "Arquivar" -- componente de card individual
- [ ] `src/pages/SuperAdmin/ClientInstances/DashboardView.tsx` -- grid de `ClientMetricCard` + card "Visão Geral" no topo (soma custo, % tenants saudáveis, totais) -- view do dashboard
- [ ] `src/pages/SuperAdmin/ClientInstances/index.tsx` -- tabs "Lista" / "Dashboard"; na aba Lista adicionar botão/toggle "Ver Arquivados"; ao arquivar chamar `archive()` e recarregar -- integrar tudo na página existente

**Acceptance Criteria:**
- Dado que sou o super-admin logado, quando acesso Clientes CRM, vejo tabs "Lista" e "Dashboard".
- Dado tab "Dashboard" ativa, vejo um card por tenant ativo com badge de saúde do backend (verde/vermelho), badge Evolution (conectado/desconectado), barras de uso e custo estimado em R$.
- Dado card "Visão Geral" no topo, vejo custo total de todos os tenants e % saudáveis.
- Dado que clico "Arquivar" em um tenant, ele some da lista/dashboard principal e aparece na aba/filtro "Arquivados".
- Dado que criei um novo CRM, em até 5 minutos o `SyncClientMetricsJob` roda e popula o primeiro snapshot.
- Dado backend_url inacessível, o badge de saúde aparece vermelho e os contadores aparecem como `–` sem erro na UI.
- Dado `RAILWAY_API_TOKEN` ausente, o custo aparece como `–` sem quebrar o job ou a UI.

## Design Notes

**Custo Evolution (rateio):**
- Custo fixo total Evolution = `EVOLUTION_MONTHLY_COST_BRL` env var (default 160.0)
- Proporção = `tenant.messages_count / sum(all_tenants.messages_count)`
- `evolution_cost = total_evolution_cost * proportion`
- `total_monthly_cost = railway_cost + evolution_cost`

**Health badge:**
- Verde: `backend_reachable: true`
- Vermelho: `backend_reachable: false`
- Cinza: sem snapshot ainda

**Snapshot upsert (evitar duplicatas no mesmo dia):**
```ruby
ClientInstanceSnapshot.find_or_initialize_by(client_instance_id: id, date: Date.today)
  .update!(attrs)
```

## Verification

**Commands:**
- `bundle exec rails db:migrate` -- expected: migrations aplicadas sem erro
- `bundle exec rails runner "SyncClientMetricsJob.new.perform(ClientInstance.active.first.id)"` -- expected: snapshot criado na tabela
- `bundle exec rspec spec/jobs/sync_client_metrics_job_spec.rb` (se existir) -- expected: green

**Manual checks:**
- Abrir Clientes CRM como super-admin → tab Dashboard carrega sem erro de console
- Card mostra dados do snapshot mais recente (ou `–` se ainda não há)
- Arquivar um tenant → some do dashboard, aparece em "Arquivados"
