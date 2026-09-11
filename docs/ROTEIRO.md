# Roteiro — IN NEURO Cefaleia
### VS Code · Claude Code em Plan Mode · deploy no Netlify

> O Netlify hospeda o **app** (PWA). Uma **skill** do Claude é outra coisa e fica no monorepo `claude-skills` — ela entra como Sprint 6, opcional, reaproveitando a mesma base de dados.

---

## O que vem no kit

| Arquivo | Para que serve |
|---|---|
| `prototipo/index.html` | O algoritmo funcionando (abre no celular, sem internet). É a **especificação executável**: o app final tem de se comportar igual. |
| `data/algoritmo.json` | **Fonte da verdade**: cefaleias, critérios, sinais de alarme, exames, procedimentos, códigos, materiais, medicamentos, checklists, glosas e referências. |
| `docs/BRIEFING.md` | Layout do PDF (igual à Guia Cirúrgica), abas, regras técnicas. |
| `docs/ROTEIRO.md` | Este arquivo. |

---

## Passo 1 — Preparar (15 min)

1. GitHub → criar repositório **privado** `in-neuro-cefaleia` (sem README), branch `main`.
2. No PowerShell:
   ```powershell
   cd D:\PROJETOS
   git clone https://github.com/neuroalfmagalhaes/in-neuro-cefaleia.git
   cd in-neuro-cefaleia
   ```
3. Extrair o **conteúdo** do zip do kit dentro dessa pasta (o `CLAUDE.md` tem de ficar na raiz).
4. Trazer o app de referência para dentro do projeto (a pasta `referencia/` não vai para o GitHub):
   ```powershell
   git clone https://github.com/neuroalfmagalhaes/in-neuro-surgical-app.git referencia\in-neuro-surgical-app
   ```
   Se o repositório estiver em outra conta, ajuste o endereço.
5. Primeiro commit:
   ```powershell
   git add .
   git commit -m "Kit inicial: algoritmo, protótipo e roteiro"
   git push
   ```
6. VS Code → *File → Open Folder* → `D:\PROJETOS\in-neuro-cefaleia` → **confiar na pasta** (o Claude Code não funciona em Restricted Mode).
7. Abrir o painel do Claude Code (ícone Spark) → `/` → trocar o modelo para **Opus 5** → selecionar o modo **Plan**.

## Passo 2 — Prompt 0: arquitetura (colar em Plan Mode)

```
Contexto: vou construir o app "IN NEURO Cefaleia". Siga o CLAUDE.md.
Leia, nesta ordem:
1. docs/ROTEIRO.md e docs/BRIEFING.md
2. data/algoritmo.json (fonte da verdade — não duplicar dados no código)
3. prototipo/index.html (especificação executável do algoritmo)
4. referencia/in-neuro-surgical-app (estrutura de abas, extração da carteirinha,
   widget de colar print da história clínica, módulo jsPDF do PDF)

Monte o plano de arquitetura do app final:
- PWA client-side, mesmo stack e visual do in-neuro-surgical-app
- toda a lógica clínica lida de data/algoritmo.json
- chamadas à API Anthropic só via Netlify Function (a chave nunca no front)
- PDFs com o módulo jsPDF copiado do app de referência (layout idêntico)

Regras:
- Não escreva código até eu aprovar.
- Nunca invente código TUSS, CID, dose, material ou referência. O que
  estiver [confirmar] ou [PREENCHER] no JSON continua assim e aparece
  destacado na interface.
- Liste no fim do plano as dúvidas que dependem de mim.
```

---

## Passo 3 — Sprints (um prompt por sprint; sempre Plan Mode → aprovar → executar)

**Sprint 1 — Esqueleto e algoritmo**
```
Sprint 1: porte as etapas 1 a 8 do prototipo/index.html para o app,
com o visual do in-neuro-surgical-app, lendo tudo de data/algoritmo.json.
Inclua a etapa "Bloqueio teste e observação" (Arnold e salvas com
radiofrequência): máquina de estados pendente → negativo / em observação /
alívio sustentado / RF indicada, lida de bloqueio_teste no JSON; as etapas
seguintes ficam travadas até "RF indicada".
Aceite: os 10 caminhos válidos (5 cefaleias × procedimentos permitidos)
e os 5 estados do bloqueio teste geram exatamente os mesmos textos do
protótipo.
```

**Sprint 2 — Entrada de dados**
```
Sprint 2: carteirinha (foto → Netlify Function → Claude vision → JSON
estrito) e história clínica (colar print com Ctrl+V, arrastar, câmera no
celular, ou texto) → prosa em 3ª pessoa. Campos sempre editáveis.
Os dados preenchem as etapas 2, 5 e a tabela de tratamentos prévios.
Aceite: nenhum campo inventado; ilegível = vazio + aviso.
```

**Sprint 3 — PDFs no padrão IN NEURO**
```
Sprint 3: gerar em PDF a Guia de Procedimento, o Relatório de
Justificativa e a Solicitação de Exames (1 página por exame), com o
módulo jsPDF do app de referência: logo, marca d'água, moldura tripla
teal/dourado, rodapé Vinci ou Floriano por botão, espaço de assinatura
vazio para Bird ID/Gov.br.
Aceite: lado a lado com uma Guia Cirúrgica atual, o layout é idêntico.
```

**Sprint 4 — Contestação**
```
Sprint 4: etapa "Se houver negativa" com os 9 motivos de glosa do JSON.
Gerar PDF do pedido de reanálise à Ouvidoria (assinado pelo médico) e o
Kit NIP para o paciente (texto em 1ª pessoa + lista de anexos + como
registrar). Incluir o checklist dos 5 requisitos da ADI 7265 quando o
pedido for fora do Rol, e mostrar o aviso interno do Botox/enxaqueca.
```

**Sprint 4b — Acompanhamento do bloqueio teste**
```
Sprint 4b: salvar localmente (no aparelho, sem servidor) os casos em
observação após bloqueio teste, com data prevista de reavaliação (4 e 12
semanas) e lembrete no calendário. Na reavaliação, abrir o caso já na
etapa "Observação". Gerar em PDF a guia do bloqueio teste e a ficha de
dor pós-bloqueio para o paciente.
```

**Sprint 5 — Remuneração legítima e pré-operatório**
```
Sprint 5: tela "Operadoras" onde eu cadastro, por operadora: valor ou
porte de cada código e as regras de quantidade (por nervo, lado,
segmento; radioscopia por hora). O app, entre códigos igualmente
corretos para o ato, sugere o de maior valor e avisa acessórios
esquecidos (radioscopia, lateralidade, sedação). Nunca sugerir código
que não descreva o ato realizado.
Para radiofrequência sob sedação: gerar a rotina pré-operatória
reaproveitando as abas Encaminhamentos e Exames do app de referência.
```

**Sprint 6 (opcional) — Skill do Claude**
```
Sprint 6: empacotar data/algoritmo.json + prompts como a skill
"neuroalf-cefaleia" no monorepo claude-skills (pasta IN NEURO -
Ferramentas/), no mesmo formato da skill solicitacao-cirurgia.
```

---

## Passo 4 — Deploy no Netlify

1. **netlify.toml** na raiz (o Claude Code cria no Sprint 1):
   ```toml
   [build]
     publish = "."
     functions = "netlify/functions"
   ```
2. Netlify → *Add new site* → *Import from GitHub* → `in-neuro-cefaleia` → branch `main`.
   Deploy sempre pelo GitHub: o deploy via MCP retorna erro 403 nesta conta.
3. *Site configuration → Environment variables* → `ANTHROPIC_API_KEY`.
   Cadastrar **sem** a opção de segredo: variáveis marcadas como secretas já sumiram silenciosamente neste ambiente.
4. Nome do site: `in-neuro-cefaleia` → `in-neuro-cefaleia.netlify.app`.
5. No celular: abrir o site → *Adicionar à tela inicial* (PWA).
6. Teste pós-deploy:
   - rodar os 10 caminhos e gerar um PDF de cada tipo;
   - no navegador, buscar `sk-ant` no código-fonte público — **não pode aparecer**;
   - conferir que nenhum dado de paciente fica salvo no servidor (LGPD).

---

## Passo 5 — Validar antes do primeiro paciente real

- [ ] Todos os itens `[confirmar]` e `[PREENCHER]` do `data/algoritmo.json`.
- [ ] Corrigir "Ropivacaína 2%" na base da skill atual (apresentação inexistente).
- [ ] CID padrão da neuralgia occipital; aceitação de G43.7 por operadora.
- [ ] Enquadramento da RF pulsada (31403336) e da RF térmica do esfenopalatino (31602134) com as principais operadoras.
- [ ] Materiais de RF com o fornecedor (cânula, eletrodo, placa).
- [ ] Confirmar o período de observação do protocolo (padrão 4–12 semanas, editável em `bloqueio_teste` no JSON) e o anestésico padrão do bloqueio teste.
- [ ] Tabela de valores por operadora (Sprint 5).
- [ ] Conferir volume/páginas das referências.
- [ ] Acompanhar a decisão final da Conitec (CP 70/2026): se o Botox for incorporado ao SUS, entra no Rol em até 60 dias e o risco muda de alto para baixo — atualizar o JSON.

---

## Manutenção

- **Mudou regra, código ou evidência?** Editar só o `data/algoritmo.json`, subir versão em `meta.versao`, commit → o Netlify publica sozinho.
- **Glosa nova que se repete?** Adicionar em `glosas` com os três textos (ouvidoria, nip, interno).
