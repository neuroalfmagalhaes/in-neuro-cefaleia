# IN NEURO Cefaleia — instruções do projeto

App (PWA) do Dr. Alfredo Magalhães, neurocirurgião (CREMESP 135506 / RQE 72972), para gerar Guias de Procedimento de cefaleia com indicação baseada em literatura, reduzir glosas e conduzir a contestação (Ouvidoria → NIP).

## Fontes da verdade (nesta ordem)
1. `data/algoritmo.json` — toda a lógica clínica e regulatória. Nunca duplicar esses dados no código.
2. `prototipo/index.html` — especificação executável: o app final deve gerar os mesmos textos.
3. `docs/BRIEFING.md` — layout do PDF (idêntico à Guia Cirúrgica), abas e regras.
4. `docs/ROTEIRO.md` — sprints, critérios de aceite e deploy.
5. `referencia/in-neuro-surgical-app/` — app de referência, **somente leitura**: copiar componentes (carteirinha, colar print, módulo jsPDF), nunca editar.

## Regras invioláveis
- Nunca inventar código TUSS, CID, dose, material ou referência. Itens `[confirmar]` e `[PREENCHER]` continuam assim e aparecem destacados na interface.
- Nunca sugerir código que não descreva o ato realizado (ex.: 31602134 em bloqueio só com anestésico/corticoide).
- Radiofrequência em neuralgia occipital e cefaleia em salvas só é liberada após bloqueio teste positivo com retorno da dor (`bloqueio_teste` no JSON).
- Chave da API Anthropic só em Netlify Function (`netlify/functions/`); nunca no front-end.
- Dados de paciente ficam só na sessão/aparelho; nada salvo em servidor (LGPD).
- Não alterar cabeçalho, rodapé ou moldura do PDF sem autorização explícita.
- Interface e documentos em português do Brasil.

## Stack e deploy
- HTML/JS client-side + PWA, jsPDF (módulo copiado do app de referência).
- Deploy: GitHub → Netlify, branch `main`. O deploy via MCP retorna 403 nesta conta.
- `ANTHROPIC_API_KEY` no Netlify sem marcar como secreta (variáveis secretas já sumiram silenciosamente neste ambiente).

## Forma de trabalhar
- Plan Mode antes de cada sprint; só executar após aprovação.
- Um sprint por vez; commit ao final com a mensagem `Sprint N: <resumo>`.
- Mudança de regra clínica, código ou evidência: editar só o JSON e subir `meta.versao`.
- Respostas em português, breves e diretas; listar dúvidas que dependem do Dr. Alfredo em vez de supor.
