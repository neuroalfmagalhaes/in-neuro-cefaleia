# IN NEURO Cefaleia — Briefing para Claude Code (Plan Mode)

> Projeto: `in-neuro-cefaleia` · Dr. Alfredo Magalhães (CREMESP 135506 / RQE 72972)
> Objetivo: gerar Guias de Procedimento para cefaleia com indicação baseada em literatura, reduzir glosas e, se houver negativa, conduzir a contestação (Ouvidoria → NIP).

---

## 0. Como usar

O passo a passo de instalação, os prompts do Plan Mode e o deploy estão em `docs/ROTEIRO.md`. As regras permanentes do projeto estão no `CLAUDE.md` da raiz.

---

## 1. Reaproveitamento obrigatório do app Rotina Cirúrgica

### 1.1 Entrada de dados (idêntico ao app atual)
- **Carteirinha**: foto/upload → Anthropic vision → **JSON estrito** (nome, nascimento, operadora, nº carteirinha, plano, validade, acomodação, registro ANS). CPF em campo manual. Campo ilegível = vazio + aviso, nunca adivinhar.
- **História clínica**: widget para **colar print** (Ctrl+V), arrastar arquivo ou câmera no celular; alternativa de colar texto. Extração em **prosa, 3ª pessoa, português** → HDA, exame neurológico, exames citados, CID se mencionado.
- Todos os campos extraídos ficam **editáveis** antes de gerar o PDF.

### 1.2 PDF (layout idêntico à Guia de Procedimento Cirúrgico)
Copiar o módulo jsPDF do app. Especificação de referência (espelho de `gerar_guia_cirurgia.py` da skill):

| Elemento | Especificação |
|---|---|
| Página | A4 · margens 2,6 cm (sup/inf) e 2,8 cm (lat) |
| Logo | IN NEURO no topo da 1ª página, 8,5 cm de largura |
| Marca d'água | símbolo IN NEURO 15 × 15 cm, centralizado, todas as páginas |
| Moldura | tripla: externa espessa teal `#1a5c52`, meio fina dourada `#b8926a`, interna fina teal · adornos nos 4 cantos |
| Nome do médico | 14 pt, negrito-itálico, centralizado, teal |
| Linha CREMESP/RQE | 10,5 pt negrito, cinza `#444444` |
| Título do documento | 11 pt, negrito, CAIXA ALTA, sublinhado, centralizado |
| Corpo | 10,5 pt · seções `# TÍTULO:` em negrito, nunca separadas dos seus itens na quebra de página |
| Assinatura | espaço em branco reservado, **sem linha e sem texto** (Bird ID / Gov.br com QR code) |
| Rodapé | preto, 9,6 pt, centralizado, linha cinza `#999999` acima · endereço **Vinci** ou **Floriano** escolhido por **botão**, nunca digitado |

- Usar a mesma fonte já corrigida no app (houve bug de resíduo de Helvetica — não regredir).
- **Não alterar cabeçalho/rodapé** sem autorização explícita.

---

## 2. Abas do app

| # | Aba | Função | Saída |
|---|---|---|---|
| 1 | **Triagem** | Fluxograma diagnóstico: critérios ICHD-3 + sinais de alarme (SNNOOP10) | Hipótese diagnóstica |
| 2 | **Exames de Imagem** | Checklist de RM/TC por cefaleia e por procedimento (seção 3.7) | Solicitação de Exames em PDF — 1 página por exame, com justificativa clínica e CID (mesmo formato da aba Exames do app atual) |
| 3 | **Elegibilidade** | Checklist por cefaleia × procedimento | Semáforo de risco de glosa + lista do que falta documentar |
| 4 | **Guia de Procedimento** | Mesmo documento da Guia Cirúrgica, adaptado | PDF |
| 5 | **Relatório de Justificativa Técnica** | Texto com indicação, falhas terapêuticas e referências fixas | PDF (anexo da guia) |
| 6 | **Contestação** | Pedido de reanálise à Ouvidoria da operadora, conforme o motivo da negativa | PDF |
| 7 | **Kit NIP** | Texto em 1ª pessoa para o **paciente** registrar a NIP + lista de anexos | PDF/TXT para o paciente |

Fluxo: 1 → 2 → 3 → (4 + 5 juntos) → se negada: 6 → se mantida: 7.
Procedimentos cobertos: **Bloqueio de nervos cranianos · Botox (PREEMPT) · Radiofrequência (térmica ou pulsada)**.
Para radiofrequência sob sedação, o app deve oferecer também a rotina pré-procedimento (exames laboratoriais/encaminhamentos) reaproveitando as abas Encaminhamentos e Exames do app atual.
Os dados do paciente preenchidos uma vez alimentam todas as abas.

### Seções da Guia (aba 4)
`# HISTÓRIA DA DOENÇA ATUAL:` · `# EXAME NEUROLÓGICO:` · `# EXAMES COMPLEMENTARES:` (uma linha "*" por exame citado, nunca linha vazia) · `# TRATAMENTOS PRÉVIOS:` (**nova** — medicação, dose, tempo, motivo da suspensão) · `# INDICAÇÃO:` · `# CÓDIGOS:` · `# MATERIAIS/MEDICAMENTOS:` · `# CID:`

---

## 3. Base de conhecimento (`data/*.json`) — fonte da verdade

### 3.1 Cefaleias (critérios-chave, validar com o Dr. Alfredo)

| Cefaleia | ICHD-3 | Critérios que a auditoria procura |
|---|---|---|
| Enxaqueca crônica | 1.3 | ≥15 dias de cefaleia/mês por >3 meses, sendo ≥8 dias com características de migrânea · diário de cefaleia |
| Tipo tensional | 2.1–2.3 | Frequência (episódica infrequente/frequente/crônica ≥15 dias/mês) · ausência de características migranosas |
| Neuralgia occipital (Arnold) | 13.4 | Dor paroxística no território do occipital maior/menor/3º occipital · alodinia/disestesia · dor à palpação · **alívio temporário com bloqueio anestésico do nervo** (o bloqueio faz parte do critério diagnóstico) |
| Cefaleia em salvas | 3.1 | Dor unilateral orbitária/supraorbitária/temporal, 15–180 min, sinais autonômicos ipsilaterais ou inquietação, 1 crise a cada 2 dias até 8/dia |
| Neuralgia do trigêmeo | 13.1 | Paroxismos de <1 s a 2 min no território do V, gatilhos · classificar clássica (compressão neurovascular com alteração morfológica na RM), idiopática ou secundária · RM com sequência FIESTA/CISS |

### 3.2 Matriz de risco de glosa (regra do semáforo)

| Cefaleia | Bloqueio de nervos | Botox (PREEMPT) | Radiofrequência |
|---|---|---|---|
| Enxaqueca crônica | 🟡 baixo–moderado (ponte no uso excessivo de analgésicos, crise refratária) | 🔴 alto — fora da DUT; exige dossiê completo (ver 3.4) | ⛔ não previsto |
| Tensional | 🟠 moderado–alto (evidência fraca) | ⛔ **não solicitar** — ensaios negativos, diretriz EFNS não recomenda; o app deve bloquear com alerta | ⛔ não previsto |
| Neuralgia occipital | 🟢 baixo (diagnóstico + terapêutico) | ⛔ não previsto | 🟢 baixo — **pulsada** no occipital maior/menor · coberta pela DUT 62 (item 3) se refratária ≥3 meses |
| Salvas | 🟢 baixo — occipital maior **com corticoide** (ECRs) | ⛔ não previsto | 🔴 alto — gânglio esfenopalatino **não está na DUT 62**; evidência de séries de casos (majoritariamente térmica) |
| Neuralgia do trigêmeo | 🟡 moderado (ponte) · o fluxograma deve apontar RM + opções cirúrgicas do Rol | 🔴 alto — off-label | 🟢 baixo — **térmica** do gânglio de Gasser · coberta pela DUT 62 (item 3) |

### 3.3 Checklist — Bloqueio de nervos cranianos
- Diagnóstico ICHD-3 documentado.
- Indicação explícita: ponte no uso excessivo de medicação · crise refratária · início do período de salvas · confirmação diagnóstica na neuralgia occipital · ponte na neuralgia do trigêmeo.
- Nervos e lateralidade: occipital maior, occipital menor, supraorbital, supratroclear, auriculotemporal (uni/bilateral).
- Medicamentos: **alerta automático** — na enxaqueca, o corticoide não mostrou benefício adicional sobre o anestésico isolado; na salvas, o corticoide no occipital maior é o componente com evidência. Sugerir a mistura conforme o diagnóstico.
- Repetição: se seriado, justificar intervalo e resposta à sessão anterior (% de redução de dias de dor).

### 3.4 Checklist — Botox (PREEMPT), alinhado aos critérios de NICE / Conitec
- Idade ≥18 anos.
- Enxaqueca crônica ICHD-3 1.3 com **diário de cefaleia** (mínimo 4 semanas; ideal 3 meses).
- **Falha, intolerância ou contraindicação a ≥3 profiláticos**, cada um com classe, dose, tempo de uso e motivo da suspensão (tabela obrigatória).
- Uso excessivo de medicação sintomática identificado e manejado.
- Escalas basais: MIDAS e HIT-6.
- Protocolo: 155 U em 31 pontos (até 195 U em 39 pontos, *follow-the-pain*), a cada 12 semanas → 2 frascos de 100 U.
- Contraindicações: gestação, lactação, doença da junção neuromuscular, infecção local.
- **Renovação**: registrar resposta após 2 ciclos. Critério NICE de suspensão: redução <30% dos dias de cefaleia após 2 ciclos, ou retorno a enxaqueca episódica (<15 dias/mês) por 3 meses consecutivos. A aba deve ter o campo "resposta ao ciclo anterior" para os pedidos de continuidade.

### 3.5 Checklist — Radiofrequência (térmica × pulsada)

**Cobertura**: "Rizotomia percutânea com ou sem radiofrequência" — **DUT 62, item 3**: nevralgia do trigêmeo, glossofaríngeo, **occipital** ou intermédio, **refratária ou intolerante ao tratamento clínico contínuo por ≥3 meses**. Cefaleia em salvas **não** está na DUT → tratar como fora do Rol (checklist ADI 7265 da seção 4.2).

**Modalidade por alvo (regra do app — o médico pode sobrescrever, com justificativa)**

| Cefaleia | Alvo | Modalidade padrão | Racional |
|---|---|---|---|
| Neuralgia occipital (Arnold) | Occipital maior e/ou menor (uni/bilateral) | **Pulsada** | Nervo periférico sensitivo: pulsada é não destrutiva e evita neurite/dor de desaferentação; ECR de pulsada × corticoide e série prospectiva |
| Cefaleia em salvas (crônica, refratária) | Mesmo alvo do bloqueio teste positivo: occipital maior ipsilateral ou gânglio esfenopalatino | **Pulsada** (protocolo IN NEURO) · térmica como alternativa | Pulsada do esfenopalatino: série com seguimento de 12–30 meses (Fang 2016); térmica: séries mais antigas (Sanders 1997, Narouze 2009) |
| Neuralgia do trigêmeo | Gânglio de Gasser (forame oval) | **Térmica** | ECR: pulsada isolada foi inferior à convencional na neuralgia do trigêmeo |

> Nota para o Dr. Alfredo: a pulsada é de fato a preferida no **occipital**; na **salvas** e no **trigêmeo** a literatura favorece a térmica. O app sugere a modalidade pelo alvo, não por cefaleia genérica.

**Itens obrigatórios do checklist**
- Diagnóstico ICHD-3 documentado (13.4, 3.1 crônica ou 13.1).
- Tratamento clínico contínuo **≥3 meses** com falha/intolerância — tabela de medicamentos (ex.: carbamazepina/oxcarbazepina na neuralgia do trigêmeo; profiláticos da salvas: verapamil, lítio etc.), com dose, tempo e desfecho.
- **Occipital e salvas — fluxo obrigatório de bloqueio teste** (`bloqueio_teste` no JSON):
  1. Bloqueio anestésico teste do alvo (guia própria, código 31602045) + ficha de dor para o paciente (0–10 antes, 30 min, 1 h, 3 h, 24 h).
  2. **Positivo** = alívio ≥50% durante a ação do anestésico: ≥90 min com lidocaína ou ≥3 h com bupivacaína/ropivacaína (critério de inclusão do ECR de Cohen).
  3. **Observação com medicação** por 4–12 semanas (parâmetro do protocolo IN NEURO — não há prazo fixo em diretriz; na neuralgia occipital esse período conta para os 3 meses da DUT 62).
  4. Estados: pendente → negativo (RF não indicada) · em observação · alívio sustentado ≥12 semanas (repetir bloqueio, RF não agora) · **retorno da dor → RF pulsada indicada**.
  5. As etapas de dossiê, guia, relatório e contestação da RF só se abrem no estado "RF indicada"; o relatório recebe automaticamente a frase com data, alvo, fármaco, dor antes/depois, % de alívio e dias até o retorno.
- Exames de imagem da seção 3.7 anexados (excluir causa secundária).
- Lateralidade, nível/alvo, modalidade e parâmetros (pulsada: 42 °C, tempo por ciclo; térmica: temperatura e tempo por lesão) **[PREENCHER padrão do Dr. Alfredo]**.
- Guia por radioscopia e sedação/anestesia: incluir na guia (evita glosa de "material/equipe negado").
- Repetição: registrar duração do alívio do procedimento anterior.

### 3.6 Códigos (fonte única: `data/algoritmo.json`)

| Procedimento | TUSS | Observação |
|---|---|---|
| Bloqueio anestésico de nervos cranianos | 31602045 | qtd. por nervo/lado conforme operadora · **nunca** usar 31602134 (neurolítico) em bloqueio só com anestésico/corticoide |
| Toxina botulínica — "por membro ou segmento corporal" | 20103140 | qtd. por segmento (cabeça, pescoço) conforme operadora · DUT não inclui enxaqueca |
| Rizotomia percutânea por segmento — qualquer método (occipital) | 31403336 | DUT 62, item 3 |
| Tratamento de nevralgia do trigêmio por técnica percutânea — qualquer método | 31404030 | mais específico que 31403336; a descrição manda cobrar a imagem à parte |
| Bloqueio neurolítico de nervos cranianos (RF térmica do esfenopalatino) | 31602134 | **[confirmar enquadramento]** · fora da DUT 62 |
| Radioscopia para acompanhamento de procedimento (hora ou fração) | 40811026 | sempre que houver radioscopia |
| Materiais de RF (cânula/eletrodo) | **[PREENCHER]** | modelos do fornecedor habitual |
| CIDs | G43.x · G44.2 · G44.0 · G50.0 · Arnold **[PREENCHER]** | confirmar G43.7 por operadora |

### 3.7 Checklist — Exames de imagem (aba 2)

**Regra geral**: sinal de alarme (SNNOOP10), mudança de padrão, exame neurológico alterado ou cefaleia nova após 50 anos → **RM de crânio com e sem contraste**. TC de crânio só em urgência (cefaleia em trovoada, trauma) ou contraindicação à RM. Cada exame sai com justificativa clínica e CID — exame sem justificativa é motivo frequente de glosa.

| Cefaleia | Exame | Quando | Justificativa-padrão (editável) |
|---|---|---|---|
| Enxaqueca | RM de crânio c/ e s/ contraste | Sinais de alarme, aura atípica ou **antes de Botox** (dossiê) | Excluir cefaleia secundária antes de procedimento |
| Tensional | — | Não rotineiro (só com sinais de alarme) | — |
| Salvas | RM de crânio c/ contraste, com atenção à **sela túrcica/hipófise e seio cavernoso** | Todos os casos (excluir cefaleia trigêmino-autonômica sintomática) · antes de RF | Lesões selares e parasselares podem mimetizar salvas |
| Neuralgia occipital (Arnold) | **RM de coluna cervical** (junção craniocervical, C1–C2) + **RM de crânio** (fossa posterior, malformação de Chiari) | Antes de RF; sempre que houver déficit ou dor atípica | Excluir compressão estrutural do occipital maior / C2 |
| Neuralgia occipital | TC de coluna cervical (C1–C2) | Suspeita de patologia óssea/degenerativa ou contraindicação à RM | Avaliação óssea da junção craniocervical |
| Neuralgia do trigêmeo | RM de crânio com **T2 de alta resolução (FIESTA/CISS) + angio-RM 3D TOF + contraste** | Todos os casos (diretriz EAN) · antes de RF | Compressão neurovascular, tumor de ângulo pontocerebelar, esclerose múltipla |
| Neuralgia do trigêmeo | TC de base de crânio (forame oval) | Opcional, planejamento de RF com anatomia difícil | Planejamento do acesso percutâneo |

- O app marca como "já realizado" o exame com data e laudo anexados, e alerta se o laudo for antigo **[PREENCHER: validade aceita, ex.: 12 meses]**.
- Códigos TUSS: RM crânio 41101014 · RM sela/hipófise 41101022 · RM coluna cervical 41101227 · angio-RM 41101324 **[confirmar]** · TCs **[PREENCHER]**.

### 3.8 Referências fixas (o Claude só pode citar estas; conferir volume/páginas antes de ativar)

**Clínicas**
- Headache Classification Committee of the IHS. ICHD-3. *Cephalalgia* 2018;38(1):1–211.
- Aurora SK et al. PREEMPT 1. *Cephalalgia* 2010;30(7):793–803.
- Diener HC et al. PREEMPT 2. *Cephalalgia* 2010;30(7):804–814.
- Dodick DW et al. PREEMPT pooled analysis. *Headache* 2010;50(6):921–936.
- NICE TA260 — Botulinum toxin type A for the prevention of headaches in adults with chronic migraine (2012).
- Blumenfeld A et al. Expert consensus recommendations for the performance of peripheral nerve blocks for headaches. *Headache* 2013;53(3):437–446.
- Ambrosini A et al. Suboccipital steroid injection in cluster headache (ECR). *Pain* 2005;118(1–2):92–96.
- Leroux E et al. Suboccipital steroid injections for transitional treatment of cluster headache (ECR). *Lancet Neurol* 2011;10(10):891–897.
- Bendtsen L et al. EFNS guideline on the treatment of tension-type headache. *Eur J Neurol* 2010;17(11):1318–1325.
- SBCe — Consenso de tratamento profilático da migrânea. **[PREENCHER: edição mais recente]**
- Cohen SP et al. Pulsed radiofrequency versus steroid injections for occipital neuralgia or migraine with occipital nerve tenderness (ECR). *Pain* 2015;156(12):2585–2594.
- Vanelderen P et al. Pulsed radiofrequency for occipital neuralgia: prospective study. *Reg Anesth Pain Med* 2010;35(2):148–151.
- Sanders M, Zuurmond WW. Sphenopalatine ganglion blockade/RF in 66 patients with cluster headache. *J Neurosurg* 1997;87(6):876–880.
- Narouze S et al. Sphenopalatine ganglion radiofrequency ablation for chronic cluster headache. *Headache* 2009;49(4):571–577.
- Erdine S et al. Pulsed × conventional radiofrequency in idiopathic trigeminal neuralgia (ECR). *Eur J Pain* 2007;11(3):309–313.
- Kanpolat Y et al. Percutaneous controlled radiofrequency trigeminal rhizotomy — 25 anos, 1.600 pacientes. *Neurosurgery* 2001;48(3):524–534.
- Bendtsen L et al. EAN guideline on trigeminal neuralgia. *Eur J Neurol* 2019;26(6):831–849.
- Do TP et al. Red and orange flags for secondary headaches (SNNOOP10). *Neurology* 2019;92(3):134–144.

**Regulatórias**
- Lei 9.656/1998, art. 10 §13 (redação da Lei 14.454/2022) — cobertura fora do Rol.
- STF, ADI 7265 (18/09/2025) — 5 requisitos cumulativos: (i) prescrição do médico assistente; (ii) inexistência de negativa expressa da ANS ou de análise pendente; (iii) ausência de alternativa terapêutica adequada no Rol; (iv) eficácia e segurança com evidência de alto nível; (v) registro na Anvisa.
- Lei 14.307/2022 (art. 10 §10 da Lei 9.656) — tecnologia incorporada ao SUS pela Conitec entra no Rol em até 60 dias.
- Conitec — Consulta Pública nº 70/2026: toxina A na migrânea crônica após falha de ≥3 profiláticos (**acompanhar a decisão final**).
- RN 623/2024 (vigente desde 01/07/2025) — negativa sempre por escrito, com fundamento; reanálise pela Ouvidoria.
- RN 483/2022 — NIP (operadora tem até 5 dias úteis na NIP assistencial).
- RN 424/2017 — junta médica em caso de divergência técnica.
- RN 566/2022 — prazos máximos de atendimento.
- Rol da ANS — DUT 62 (Rizotomia percutânea com ou sem radiofrequência), item 3: nevralgias do trigêmeo, glossofaríngeo, occipital ou intermédio refratárias ≥3 meses.

---

## 4. Contestação (aba 6) e Kit NIP (aba 7)

### 4.1 Sequência
1. Exigir a **negativa por escrito** com fundamento (RN 623).
2. **Reanálise pela Ouvidoria**, com relatório técnico e anexos.
3. Divergência técnica do auditor → pedir **junta médica** (RN 424).
4. Negativa mantida → **Kit NIP**, registrado **pelo paciente** (portal da ANS ou Disque ANS 0800 701 9656).
5. NIP sem solução → encaminhar ao jurídico (dossiê já montado nos 5 requisitos da ADI 7265).

### 4.2 Motivo da glosa → contra-argumento → anexos

| Motivo alegado | Contra-argumento | Anexos |
|---|---|---|
| Fora do Rol / da DUT (Botox) | Checklist dos 5 requisitos da ADI 7265; ausência de alternativa no Rol para o caso; PREEMPT + NICE; status da Conitec CP 70/2026. **Aviso interno**: a recomendação desfavorável da ANS (ciclo 2020) é o ponto fraco — o app deve mostrar isso ao médico, não esconder. | Relatório, diário, tabela de profiláticos, MIDAS/HIT-6 |
| Falha terapêutica não comprovada | Tabela de profiláticos com dose, tempo e desfecho | Receitas/prontuário |
| "Procedimento estético" | Código terapêutico, CID neurológico, protocolo PREEMPT | Relatório |
| Quantidade de unidades/frascos | 155–195 U pelo protocolo → 2 frascos de 100 U | Referências PREEMPT |
| Divergência do auditor | Solicitar junta médica | Relatório + literatura |
| Sem resposta no prazo | Prazos da RN 566/2022 | Protocolo da solicitação |
| RF: "não preenche DUT 62" (occipital/trigêmeo) | Mostrar item a item: diagnóstico + tratamento clínico ≥3 meses com falha | Tabela de medicamentos, bloqueio diagnóstico, imagem |
| RF na salvas (fora da DUT 62) | Checklist ADI 7265; refratariedade documentada; séries de casos. **Aviso interno**: evidência baixa — risco real de manutenção da negativa | Relatório, diário de crises, profiláticos |
| RF: radioscopia/material/anestesia negados | Procedimento percutâneo guiado por imagem exige esses itens; negar parte inviabiliza o todo | Guia com itens discriminados |
| Exame de imagem negado | Justificativa clínica + sinal de alarme/pré-procedimento + diretriz | Solicitação com CID e justificativa |

---

## 5. Técnico

- **Stack**: HTML/JS client-side + PWA, como o app de referência. Deploy por **GitHub CD → Netlify, branch `main`** (o deploy via MCP retorna 403).
- **Chave da API Anthropic**: verificar como o app atual a protege. Se estiver no front-end, mover para uma **Netlify Function** (proxy) com a chave em variável de ambiente (`envVarIsSecret: false`, por causa do bug já conhecido).
- **Modelo**: o mesmo do app atual (ou `claude-sonnet-5`).
- **LGPD**: dados de saúde. Nada de persistência de paciente no servidor; tudo em memória na sessão. Opcional: salvar o PDF final na pasta do paciente no Google Drive.
- **Prompts**:
  - carteirinha → JSON estrito, sem texto extra;
  - história → prosa em 3ª pessoa;
  - relatório/contestação → só referências de `data/references.json`, dados ausentes marcados `[PREENCHER]`, sem inventar achados, doses ou códigos.

---

## 6. Sprints

1. **Sprint 1** — Estrutura do app + entrada de dados (carteirinha e print) + **Guia e Relatório** para Bloqueio, Botox e Radiofrequência.
2. **Sprint 2** — Triagem (5 cefaleias) + **Exames de Imagem** + Elegibilidade com semáforo.
3. **Sprint 3** — Contestação (Ouvidoria) + Kit NIP.
4. **Sprint 4** — Via da neuralgia do trigêmeo → integração com o Rotina Cirúrgica para os procedimentos cirúrgicos.

---

## 7. Pendências para o Dr. Alfredo validar antes do Sprint 1

- [ ] Código TUSS/CBHPM e materiais do Botox (e se o frasco entra como material ou medicamento na operadora).
- [ ] Tabela de CIDs por cefaleia.
- [ ] Mistura padrão do bloqueio por diagnóstico (anestésico isolado × com corticoide).
- [ ] Radiofrequência: código TUSS da rizotomia percutânea, radioscopia, materiais (cânula/eletrodo) e parâmetros-padrão de pulsada e térmica.
- [ ] Códigos TUSS dos exames de imagem e validade aceita do laudo.
- [ ] Modelo de diário de cefaleia a ser entregue ao paciente.
- [ ] Edição mais recente do consenso da SBCe.
- [ ] Decisão final da Conitec sobre a CP 70/2026 (muda o risco do Botox de 🔴 para 🟢 se incorporado).
