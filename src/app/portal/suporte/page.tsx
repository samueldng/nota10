'use client';

import { useAuth } from '@/context/AuthContext';
import { getWhatsAppUrl, ESCOLA_CONFIG } from '@/lib/portalData';
import { MessageCircle, Mail, Phone, MapPin, ExternalLink, HelpCircle } from 'lucide-react';

const faqs = [
  {
    pergunta: 'Como funciona o acesso às vídeoaulas?',
    resposta: 'As vídeoaulas são liberadas semanalmente de acordo com o cronograma da sua turma. Você pode assisti-las a qualquer momento na aba "Videoaulas".',
  },
  {
    pergunta: 'Como justifico a falta de um aluno?',
    resposta: 'Faltas devem ser justificadas em até 24h úteis enviando uma mensagem direta para a coordenação pedagógica da escola pelo WhatsApp de suporte.',
  },
  {
    pergunta: 'Onde vejo as notas dos simulados?',
    resposta: 'Os resultados gerais dos simulados ficam visíveis na aba "Simulados". O relatório analítico detalhado (bloco por bloco) está disponível para alunos do Plano Elite na aba "Relatórios".',
  },
  {
    pergunta: 'Qual o uniforme correto?',
    resposta: 'O uniforme oficial completo é obrigatório (camiseta da escola, calça/bermuda escura e calçado fechado) para todas as aulas presenciais.',
  },
];

export default function SuportePage() {
  const { user } = useAuth();
  const nomeAluno = user?.alunoNome || 'Estudante';
  const whatsappUrl = getWhatsAppUrl(nomeAluno);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contato Direto */}
        <div className="card flex flex-col justify-between animate-fade-in-up">
          <div>
            <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-2 flex items-center gap-2">
              <MessageCircle size={18} /> Contato Direto
            </h3>
            <p className="text-sm text-[var(--color-cinza-texto)] mb-5">
              Precisa de ajuda pedagógica, financeira ou de suporte técnico? Fale conosco direto pelo WhatsApp.
            </p>

            <div className="space-y-3.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full py-3.5 no-underline flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Falar com o Nota 10 no WhatsApp
              </a>

              <div className="pt-4 border-t border-[var(--color-cinza-borda)] space-y-2">
                <div className="flex items-center gap-2 text-xs text-[var(--color-cinza-escuro)]">
                  <Phone size={14} className="text-[var(--color-cinza-texto)]" />
                  <span>Telefone: (99) 88499-016</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-cinza-escuro)]">
                  <Mail size={14} className="text-[var(--color-cinza-texto)]" />
                  <span>E-mail: contato@nota10.edu.br</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-cinza-escuro)]">
                  <MapPin size={14} className="text-[var(--color-cinza-texto)]" />
                  <span>Sede: Av. Principal, 100 — Centro</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ - Perguntas Frequentes */}
        <div className="card animate-fade-in-up delay-1">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
            <HelpCircle size={18} /> Perguntas Frequentes
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-1">
                <h4 className="text-xs font-bold text-[var(--color-azul-autoridade)]">
                  {faq.pergunta}
                </h4>
                <p className="text-xs text-[var(--color-cinza-escuro)] leading-relaxed">
                  {faq.resposta}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
