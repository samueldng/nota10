import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, UserCheck, Phone, MapPin } from 'lucide-react';

export const alunoSchema = z.object({
  nome: z.string().min(3, 'O nome completo é obrigatório.'),
  produtosIds: z.array(z.string()).min(1, 'Selecione pelo menos um acompanhamento/produto.'),
  planoPortal: z.string().min(1, 'O plano do portal é obrigatório.'),
  status: z.enum(['ativo', 'inativo']),
  turmasIds: z.array(z.string().uuid('ID de turma inválido.')).min(1, 'Vincule o aluno a pelo menos uma turma.'),
  senhaInicial: z.string()
    .regex(/^\d+$/, 'A senha deve conter estritamente números.')
    .min(4, 'A senha deve ter pelo menos 4 dígitos.'),
  resp1Nome: z.string().min(1, 'Nome do responsável 1 é obrigatório.'),
  resp1Tel: z.string().min(10, 'Telefone inválido.'),
  resp2Nome: z.string().optional(),
  resp2Tel: z.string().optional(),
  rua: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
});

export type AlunoFormData = z.infer<typeof alunoSchema>;

interface Produto {
  id: string;
  nome: string;
}

interface Turma {
  id: string;
  nome: string;
}

interface AlunoFormProps {
  alunoInicial?: Partial<AlunoFormData> | null;
  turmasAtivas: Turma[];
  produtosAtivos: Produto[];
  onClose: () => void;
  onSave: (data: AlunoFormData) => Promise<void>;
}

// Local helper to format phone
function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 3) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)})${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function AlunoForm({
  alunoInicial,
  turmasAtivas,
  produtosAtivos,
  onClose,
  onSave
}: AlunoFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    defaultValues: {
      nome: alunoInicial?.nome || '',
      produtosIds: alunoInicial?.produtosIds || [],
      planoPortal: alunoInicial?.planoPortal || 'padrao',
      status: alunoInicial?.status || 'ativo',
      turmasIds: alunoInicial?.turmasIds || [],
      senhaInicial: alunoInicial?.senhaInicial || '',
      resp1Nome: alunoInicial?.resp1Nome || '',
      resp1Tel: alunoInicial?.resp1Tel || '',
      resp2Nome: alunoInicial?.resp2Nome || '',
      resp2Tel: alunoInicial?.resp2Tel || '',
      rua: alunoInicial?.rua || '',
      bairro: alunoInicial?.bairro || '',
      cidade: alunoInicial?.cidade || ''
    }
  });

  // Watch fields that might need custom handling
  const produtosIds = watch('produtosIds');
  const turmasIds = watch('turmasIds');

  const onSubmit = async (data: AlunoFormData) => {
    try {
      await onSave(data);
    } catch (err: any) {
      alert('Erro ao salvar aluno: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in-up p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)]">
            {alunoInicial ? 'Editar Aluno' : 'Novo Aluno'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ── Dados do Aluno ── */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-cinza-borda)]">
              <UserCheck size={14} className="text-[var(--color-azul-autoridade)]" />
              <p className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase m-0">Dados do Aluno</p>
            </div>
            <div className="space-y-3">
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input
                  className="form-input"
                  {...register('nome')}
                  placeholder="Nome completo do aluno"
                />
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-group col-span-2 sm:col-span-1">
                  <label className="form-label font-bold text-xs mb-2 block">
                    Acompanhamento (Produtos) *
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-2xl border border-[var(--color-cinza-borda)]">
                    {produtosAtivos.map((produto) => {
                      const isChecked = produtosIds.includes(produto.id);
                      return (
                        <label
                          key={produto.id}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-[var(--color-azul-lightest)] border-[var(--color-azul-light)] text-[var(--color-azul-autoridade)] shadow-sm'
                              : 'bg-white border-[var(--color-cinza-borda)] text-[var(--color-cinza-texto)] hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={produto.id}
                            {...register('produtosIds')}
                            className="rounded text-[var(--color-azul-autoridade)] focus:ring-[var(--color-azul-autoridade)] w-4 h-4"
                          />
                          <span>{produto.nome}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.produtosIds && <p className="text-red-500 text-xs mt-1">{errors.produtosIds.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Plano Portal *</label>
                  <select
                    className="form-select"
                    {...register('planoPortal')}
                  >
                    <option value="padrao">Padrão</option>
                    <option value="acompanhamento">Acompanhamento</option>
                    <option value="elite">Elite</option>
                  </select>
                  {errors.planoPortal && <p className="text-red-500 text-xs mt-1">{errors.planoPortal.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="flex items-center gap-4 h-[42px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="ativo"
                        {...register('status')}
                        className="accent-[var(--color-verde-sucesso)]"
                      />
                      <span className="text-sm font-medium">Ativo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="inativo"
                        {...register('status')}
                        className="accent-[var(--color-vermelho-erro)]"
                      />
                      <span className="text-sm font-medium">Inativo</span>
                    </label>
                  </div>
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label font-bold text-xs">Turmas Vinculadas *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 p-4 rounded-2xl border border-[var(--color-cinza-borda)] max-h-48 overflow-y-auto">
                  {turmasAtivas.map((turma) => {
                    const isChecked = turmasIds.includes(turma.id);
                    return (
                      <label
                        key={turma.id}
                        className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-[var(--color-azul-lightest)] border-[var(--color-azul-light)] text-[var(--color-azul-autoridade)] shadow-sm'
                            : 'bg-white border-[var(--color-cinza-borda)] text-[var(--color-cinza-texto)] hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={turma.id}
                          {...register('turmasIds')}
                          className="rounded text-[var(--color-azul-autoridade)] focus:ring-[var(--color-azul-autoridade)] w-4 h-4"
                        />
                        <span>{turma.nome}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.turmasIds && <p className="text-red-500 text-xs mt-1">{errors.turmasIds.message}</p>}
                <span className="text-[10px] text-[var(--color-cinza-texto)] leading-snug mt-1.5 block italic">
                  💡 Dica: Marque todas as turmas que o aluno frequenta (ex: Reforço + Pré-CMT). O XP acumulado será global.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Senha Inicial do Portal (Apenas Números) *</label>
                <input
                  className="form-input"
                  {...register('senhaInicial')}
                  onChange={(e) => {
                    // Limpar letras enquanto digita
                    setValue('senhaInicial', e.target.value.replace(/\D/g, ''));
                  }}
                  placeholder="Ex: últimos 4 dígitos do WhatsApp"
                  maxLength={6}
                />
                {errors.senhaInicial && <p className="text-red-500 text-xs mt-1">{errors.senhaInicial.message}</p>}
              </div>
            </div>
          </div>

          {/* ── Responsáveis ── */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-cinza-borda)]">
              <Phone size={14} className="text-[var(--color-azul-autoridade)]" />
              <p className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase m-0">Responsáveis</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[var(--color-cinza-fundo)] rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-[var(--color-cinza-escuro)]">Responsável 1 *</p>
                <div className="form-group">
                  <label className="form-label text-[10px]">Nome</label>
                  <input
                    className="form-input"
                    {...register('resp1Nome')}
                    placeholder="Nome do responsável"
                  />
                  {errors.resp1Nome && <p className="text-red-500 text-xs mt-1">{errors.resp1Nome.message}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label text-[10px]">Telefone</label>
                  <input
                    className="form-input"
                    {...register('resp1Tel')}
                    onChange={(e) => setValue('resp1Tel', formatPhoneInput(e.target.value))}
                    placeholder="(99) 99999-9999"
                    maxLength={15}
                  />
                  {errors.resp1Tel && <p className="text-red-500 text-xs mt-1">{errors.resp1Tel.message}</p>}
                </div>
              </div>

              <div className="bg-[var(--color-cinza-fundo)] rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-[var(--color-cinza-escuro)]">Responsável 2</p>
                <div className="form-group">
                  <label className="form-label text-[10px]">Nome</label>
                  <input
                    className="form-input"
                    {...register('resp2Nome')}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label text-[10px]">Telefone</label>
                  <input
                    className="form-input"
                    {...register('resp2Tel')}
                    onChange={(e) => setValue('resp2Tel', formatPhoneInput(e.target.value))}
                    placeholder="(99) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Endereço ── */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-cinza-borda)]">
              <MapPin size={14} className="text-[var(--color-azul-autoridade)]" />
              <p className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase m-0">Endereço</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="form-group">
                <label className="form-label">Rua</label>
                <input
                  className="form-input"
                  {...register('rua')}
                  placeholder="Rua, número"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bairro</label>
                <input
                  className="form-input"
                  {...register('bairro')}
                  placeholder="Bairro"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input
                  className="form-input"
                  {...register('cidade')}
                  placeholder="Cidade"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Save size={16} /> {isSubmitting ? 'Salvando...' : (alunoInicial ? 'Salvar alterações' : 'Cadastrar Aluno')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
