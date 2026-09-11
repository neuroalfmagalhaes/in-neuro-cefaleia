// Função serverless (Netlify Functions) que recebe uma imagem em base64 — ou um texto
// colado — e usa a API da Anthropic (Claude) para extrair dados estruturados:
// carteirinha do convênio ou história clínica do prontuário.
//
// Requer a variável de ambiente ANTHROPIC_API_KEY configurada no painel do Netlify
// (Project configuration > Environment variables), SEM marcar como secreta. NUNCA
// exponha essa chave no front-end — por isso essa extração roda aqui, no servidor.
//
// Regra do projeto: a IA nunca inventa. Campo ausente ou ilegível volta vazio, e o
// app avisa o médico — preencher no chute é o que gera glosa.

const PROMPTS = {
  carteirinha: `Esta imagem é a foto de uma carteirinha de convênio médico brasileiro.
Extraia os dados visíveis e responda SOMENTE com um JSON válido (sem markdown, sem texto
antes ou depois), exatamente neste formato:
{"nome":"","nascimento":"dd/mm/aaaa","convenio":"","carteirinha":"","plano":"","acomodacao":"","registroAns":""}

Regras:
- Se um campo não estiver visível ou legível na imagem, deixe como string vazia "".
- Nunca invente ou complete dados que não estejam claramente na imagem.
- "carteirinha" é o número da carteirinha/matrícula.
- "acomodacao" é o tipo de acomodação (ex: Enfermaria, Apartamento), se constar.
- "registroAns" é o registro ANS da operadora, se constar.`,

  historia: `O conteúdo a seguir é um prontuário médico (história clínica) de um paciente
com cefaleia — pode vir como captura de tela ou como texto. Extraia o conteúdo e responda
SOMENTE com um JSON válido (sem markdown, sem texto antes ou depois), exatamente neste
formato:
{"hda":"","exameNeurologico":"","examesComplementares":"","cid":"","tratamentosPrevios":[{"medicamento":"","dose":"","periodo":"","desfecho":""}],"diasCefaleiaMes":"","midas":"","hit6":""}

REGRA MAIS IMPORTANTE — nunca inventar:
- Campo que não estiver escrito no conteúdo fica como string vazia "".
- Se não houver nenhum tratamento citado, "tratamentosPrevios" é uma lista vazia [].
- Não inferir, não completar, não deduzir e não converter doses ou unidades.
- Não transformar em achado clínico aquilo que o texto não afirma.

Demais regras:
- "hda" é a história da doença atual, em prosa corrida, 3ª pessoa, em português
  (parágrafos separados por \\n\\n). Não usar tópicos nem abreviar o que está escrito.
- "exameNeurologico" são os achados do exame físico/neurológico, também em prosa.
- "examesComplementares": exames de imagem citados no texto (RM, TC, angio-RM,
  radiografia etc.), um por linha (separados por \\n), no formato
  "NOME DO EXAME: achado principal". Apenas os realmente citados.
- "tratamentosPrevios": um item por medicamento de tratamento ou profilaxia citado
  (ex.: amitriptilina, topiramato, propranolol, carbamazepina, verapamil, lítio).
  Copie "dose", "periodo" e "desfecho" exatamente como estão escritos. Se o texto não
  disser a dose, o tempo de uso ou o motivo da suspensão, deixe aquele campo como "" —
  nunca escreva "sem melhora" ou "intolerância" por conta própria.
- "diasCefaleiaMes", "midas" e "hit6": só preencher se houver número explícito no texto.
- "cid" é o código CID-10, se constar.`
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { ...CORS, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Método não permitido' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Corpo da requisição inválido' });
  }

  const { image, mediaType, texto, tipo } = payload;
  if (!image && !texto) {
    return json(400, { error: 'Nenhuma imagem ou texto enviado' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(500, {
      error: 'ANTHROPIC_API_KEY não configurada no Netlify (Project configuration > Environment variables).',
    });
  }

  const prompt = PROMPTS[tipo] || PROMPTS.carteirinha;

  // Imagem (foto/print) ou texto colado — o prompt é o mesmo nos dois casos.
  const conteudo = image
    ? { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: image } }
    : { type: 'text', text: texto };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: [conteudo, { type: 'text', text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return json(502, { error: data.error.message || 'Erro na API do Claude' });
    }

    const textBlock = (data.content || []).find((c) => c.type === 'text');
    const raw = textBlock ? textBlock.text : '{}';
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      return json(502, { error: 'Resposta da IA não veio em formato JSON válido' });
    }

    return json(200, parsed);
  } catch (err) {
    return json(500, { error: err.message });
  }
};
