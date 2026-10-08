// Termo de compromisso do acompanhamento — texto OFICIAL que a paciente aceita.
//
// RASCUNHO: precisa ser revisado pela Renata e por advogado(a) antes de ir para
// pacientes reais. Ao mudar qualquer palavra, MUDE A `versao`: todas as pacientes
// passam a ver o termo de novo e a aceitar a nova versão no próximo acesso.
// O aceite guarda um retrato completo do texto (e o hash) da versão aceita,
// então versões antigas continuam comprováveis mesmo depois de alteradas aqui.

import { createHash } from 'node:crypto';

export const TERMO = {
  versao: '2026-10-v3',
  titulo: 'Termo de compromisso do acompanhamento psicológico',
  secoes: [
    {
      titulo: '1. Quem presta o serviço',
      paragrafos: [
        'O acompanhamento é prestado por Renata Soares, psicóloga (CRP 05/87188), sob a marca Instituto Intus ("Intus"). Este termo é firmado entre o Intus e você, que contrata o acompanhamento ("paciente"). No caso de pessoa menor de 18 anos, o termo é firmado pelo responsável legal.',
      ],
    },
    {
      titulo: '2. O que é o acompanhamento',
      paragrafos: [
        'O acompanhamento é de psicologia clínica, com abordagem sistêmica, nas modalidades individual, de casal ou de família, conforme o que você contratou.',
        'Ele não é atendimento de emergência e não substitui o acompanhamento psiquiátrico nem o uso de medicamentos prescritos. A psicóloga pode, quando entender necessário, sugerir que você procure outros profissionais ou serviços.',
        'Não há garantia de resultado: o processo depende também do seu envolvimento e da regularidade dos encontros.',
      ],
    },
    {
      titulo: '3. Pacote mensal e pagamento',
      paragrafos: [
        'O acompanhamento é contratado em pacotes mensais de 4 sessões, de 60 minutos cada. A frequência recomendada é semanal, mas você pode espaçar as sessões dentro do período do pacote.',
        'As sessões que sobrarem no mês, desde que não tenham sido perdidas por falta ou por cancelamento com menos de 24 horas, acumulam para o mês seguinte.',
        'O pagamento é antecipado e cobrado de forma recorrente a cada ciclo, por meio do InfinitePay. O valor e a forma de pagamento são informados na tela de pagamento, antes da confirmação. Seus dados de cartão são tratados pelo InfinitePay e não passam pelo Intus.',
        'Em caso de cancelamento do pacote no primeiro ciclo, há devolução de 75% do valor pago.',
        'Se, depois de ler a sua ficha, a psicóloga entender que este acompanhamento não é adequado ao seu momento, ela entrará em contato com você e tratará com você de eventual reembolso.',
      ],
    },
    {
      titulo: '4. Agendamento, remarcação e cancelamento',
      paragrafos: [
        'As sessões são agendadas por você, na área do paciente, entre os horários que a psicóloga disponibiliza a cada semana, dentro do período do seu pacote.',
        'Você pode remarcar ou cancelar uma sessão sem custo com 24 horas ou mais de antecedência.',
        'Cancelamentos com menos de 24 horas contam como sessão realizada. Em situações excepcionais, você pode contestar o cancelamento pela área do paciente, e a psicóloga avalia cada caso e decide se a sessão é devolvida ao seu pacote.',
        'Se a psicóloga precisar cancelar uma sessão, ela não é descontada do seu pacote.',
        'Em caso de atraso, a sessão termina no horário previsto.',
      ],
    },
    {
      titulo: '5. Atendimento online e presencial',
      paragrafos: [
        'As sessões podem ser online ou presenciais, conforme os horários que a psicóloga disponibiliza, e você pode alternar entre uma modalidade e outra de uma sessão para a outra. As sessões presenciais acontecem nos consultórios do Intus em Niterói (Itaipu) e no Rio de Janeiro (Barra da Tijuca), e o endereço vai no convite da sessão.',
        'As sessões online acontecem por videochamada (Google Meet), com o link enviado no convite de cada sessão. Você se compromete a participar de um local reservado, em que possa falar com privacidade, e com conexão adequada.',
        'Se a conexão falhar, a psicóloga e você tentarão restabelecê-la e, se não for possível, combinarão como seguir. O atendimento online segue as normas do Conselho Federal de Psicologia.',
        'Não é permitido gravar (áudio, vídeo ou imagem) nem transmitir as sessões, por nenhuma das partes, sem autorização expressa e por escrito.',
      ],
    },
    {
      titulo: '6. Sigilo e seus limites',
      paragrafos: [
        'Tudo o que é tratado nas sessões é protegido pelo sigilo profissional previsto no Código de Ética Profissional do Psicólogo.',
        'O sigilo pode ser quebrado somente nas hipóteses previstas em lei e no Código de Ética, como risco grave à sua vida ou integridade ou à de terceiros, ou determinação judicial, e apenas no mínimo necessário.',
        'Em atendimentos de casal ou de família, não há sigilo entre os participantes quanto ao que for tratado nas sessões conjuntas. Quem contrata o pacote responde pelo grupo perante o Intus e declara ter ciência e concordância dos demais participantes.',
      ],
    },
    {
      titulo: '7. Situações de risco',
      paragrafos: [
        'Se você estiver em risco, procure ajuda imediata: CVV, ligando 188 (24 horas, gratuito), ou SAMU, ligando 192. O Intus não funciona como serviço de emergência.',
        'Se a sua ficha ou o acompanhamento indicarem risco à sua vida, a psicóloga poderá entrar em contato diretamente com você, fora da rotina normal de agendamento, para acolhê-la.',
      ],
    },
    {
      titulo: '8. Seus dados',
      paragrafos: [
        'As suas informações são tratadas conforme a Política de Privacidade do Intus, inclusive as informações de saúde que você escolher registrar na área do paciente. Você pode consultá-las, corrigi-las ou pedir a sua exclusão a qualquer momento, pelo WhatsApp do Intus.',
      ],
    },
    {
      titulo: '9. Seus compromissos',
      paragrafos: [
        'Comparecer às sessões agendadas ou avisar com antecedência; fornecer informações verdadeiras; manter seu acesso à área do paciente de uso pessoal; e respeitar as regras deste termo.',
      ],
    },
    {
      titulo: '10. Duração e encerramento',
      paragrafos: [
        'O acompanhamento dura enquanto você mantiver o pacote ativo. Você pode encerrá-lo quando quiser, avisando a psicóloga. A psicóloga também pode encerrar o acompanhamento, com aviso e orientação sobre encaminhamentos, quando entender que ele não é mais adequado.',
      ],
    },
    {
      titulo: '11. Aceite eletrônico',
      paragrafos: [
        'Ao marcar "Li e concordo" e digitar o seu nome completo, você declara que leu e entendeu este termo e concorda com ele. Esse aceite tem valor de assinatura eletrônica, nos termos da Lei nº 14.063/2020, e ficam registrados a data, a hora, o endereço de IP e o navegador usados, além do texto exato da versão aceita.',
      ],
    },
  ],
};

// Texto corrido, na ordem em que aparece, usado para guardar o retrato do que foi aceito.
export function textoDoTermo(t = TERMO) {
  return [t.titulo, ...t.secoes.flatMap((s) => [s.titulo, ...s.paragrafos])].join('\n\n');
}

export const hashDoTermo = (t = TERMO) => createHash('sha256').update(textoDoTermo(t)).digest('hex');
