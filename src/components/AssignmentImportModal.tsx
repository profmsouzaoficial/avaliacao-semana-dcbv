import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardPaste,
  Download,
  FileText,
  Info,
  Upload,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mensagemDeErro } from '../lib/supabase';
import { baixarArquivo } from '../lib/csv';
import { analisarAtribuicoes, modeloAtribuicoes } from '../lib/assignmentImport';
import { classNames, contar } from '../lib/format';
import { Badge } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';

interface AssignmentImportModalProps {
  aberto: boolean;
  onFechar: () => void;
  onNovoMembro: () => void;
}

export function AssignmentImportModal({
  aberto,
  onFechar,
  onNovoMembro,
}: AssignmentImportModalProps) {
  const { membros, trabalhos, atribuicoes, atribuir, notificar, membro } = useApp();
  const [texto, setTexto] = useState('');
  const [aplicando, setAplicando] = useState(false);
  const [erroAplicacao, setErroAplicacao] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  const analise = useMemo(
    () => analisarAtribuicoes(texto, membros, trabalhos, atribuicoes),
    [texto, membros, trabalhos, atribuicoes],
  );

  const exemplo = useMemo(() => {
    const avaliador = membros.find((m) => m.ativo && m.papel === 'avaliador');
    const trabalho = trabalhos[0];
    if (!avaliador || !trabalho) return 'avaliador@ufjf.br;01.01';
    return `${avaliador.email};${trabalho.codigo}`;
  }, [membros, trabalhos]);

  const aplicar = async () => {
    if (aplicando || analise.validas.length === 0 || analise.problemas.length > 0) return;
    if (membro?.papel !== 'presidente') {
      setErroAplicacao('Apenas a presidência/master pode importar atribuições.');
      return;
    }

    setAplicando(true);
    setErroAplicacao(null);

    const porAvaliador = new Map<string, string[]>();
    analise.validas.forEach((item) => {
      const lista = porAvaliador.get(item.membro.id) ?? [];
      lista.push(item.trabalho.id);
      porAvaliador.set(item.membro.id, lista);
    });

    let criadas = 0;
    const falhas: string[] = [];
    for (const [avaliadorId, trabalhoIds] of porAvaliador.entries()) {
      try {
        await atribuir(avaliadorId, trabalhoIds);
        criadas += trabalhoIds.length;
      } catch (e) {
        falhas.push(mensagemDeErro(e));
      }
    }

    setAplicando(false);
    if (criadas > 0) {
      notificar(
        `${contar(criadas, 'atribuição importada', 'atribuições importadas')}.`,
        'sucesso',
      );
    }
    if (falhas.length > 0) {
      setErroAplicacao(
        `Algumas atribuições não foram salvas: ${[...new Set(falhas)].join(' ')}`,
      );
      return;
    }
    if (criadas > 0) {
      setTexto('');
      onFechar();
    }
  };

  const carregarArquivo = async (arquivo: File) => {
    setErroAplicacao(null);
    try {
      const conteudo = await arquivo.text();
      setTexto(conteudo);
    } catch (e) {
      setErroAplicacao(mensagemDeErro(e));
    }
  };

  const temTexto = texto.trim().length > 0;
  const podeAplicar = analise.validas.length > 0 && analise.problemas.length === 0 && !aplicando;

  return (
    <Modal
      aberto={aberto}
      onFechar={onFechar}
      titulo="Importar atribuições"
      descricao="Cole ou carregue uma lista de vínculos entre avaliador e trabalho. A importação cria apenas atribuições; não altera notas."
      largura="lg"
      semFechar={aplicando}
      rodape={
        <>
          <span className="mr-auto hidden text-[10px] text-ink-muted sm:block">
            {analise.problemas.length > 0
              ? 'Corrija os problemas para liberar a importação.'
              : analise.validas.length > 0
                ? `${contar(analise.validas.length, 'nova atribuição pronta', 'novas atribuições prontas')}`
                : 'Nenhuma atribuição nova para aplicar.'}
          </span>
          <Button variante="ghost" onClick={onFechar} disabled={aplicando}>
            Cancelar
          </Button>
          <Button
            variante="primary"
            onClick={() => void aplicar()}
            carregando={aplicando}
            disabled={!podeAplicar}
            icone={<CheckCircle2 className="h-4 w-4" />}
          >
            Aplicar {analise.validas.length > 0 ? analise.validas.length : ''}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-brand-200 bg-brand-50/80 px-4 py-3 text-[11.5px] leading-relaxed text-brand-900">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <div>
              <p className="font-semibold">Formato: uma linha por atribuição.</p>
              <p className="mt-1">
                Aceita <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[10.5px]">email;código</code>{' '}
                ou <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[10.5px]">código;email</code>.
                Exemplo: <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[10.5px]">{exemplo}</code>.
                Cabeçalho e linhas iniciadas por <code>#</code> são ignorados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variante="secondary"
            tamanho="sm"
            onClick={() => arquivoRef.current?.click()}
            icone={<Upload className="h-3.5 w-3.5" />}
          >
            Carregar arquivo
          </Button>
          <Button
            variante="secondary"
            tamanho="sm"
            onClick={() => baixarArquivo('modelo-atribuicoes.csv', modeloAtribuicoes())}
            icone={<Download className="h-3.5 w-3.5" />}
          >
            Baixar modelo
          </Button>
          <Button
            variante="ghost"
            tamanho="sm"
            onClick={() => setTexto('')}
            disabled={!temTexto || aplicando}
          >
            Limpar
          </Button>
          <Button
            variante="ghost"
            tamanho="sm"
            onClick={onNovoMembro}
            disabled={aplicando}
            icone={<UserPlus className="h-3.5 w-3.5" />}
          >
            Cadastrar avaliador
          </Button>
          <input
            ref={arquivoRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              e.target.value = '';
              if (arquivo) void carregarArquivo(arquivo);
            }}
          />
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-soft">
            <ClipboardPaste className="h-3.5 w-3.5" />
            Lista de atribuições
          </span>
          <textarea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setErroAplicacao(null);
            }}
            disabled={aplicando}
            rows={9}
            spellCheck={false}
            placeholder={`# Cole aqui a lista\n${exemplo}\n`}
            className="w-full resize-y rounded-2xl border border-line bg-white px-3.5 py-3 font-mono text-[12px] leading-relaxed text-ink outline-none transition placeholder:font-sans placeholder:text-ink-muted/60 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </label>

        {temTexto && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge tom={analise.validas.length > 0 ? 'green' : 'neutral'} ponto>
                {contar(analise.validas.length, 'nova', 'novas')}
              </Badge>
              <Badge tom="neutral">
                {contar(analise.existentes.length, 'já existia', 'já existiam')}
              </Badge>
              <Badge tom={analise.problemas.length > 0 ? 'rose' : 'green'} ponto>
                {contar(analise.problemas.length, 'problema', 'problemas')}
              </Badge>
              {analise.trabalhosComDoisOuMais > 0 && (
                <Badge tom="amber" ponto>
                  {contar(analise.trabalhosComDoisOuMais, 'trabalho com 2+', 'trabalhos com 2+')}
                </Badge>
              )}
            </div>

            {erroAplicacao && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-100/70 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-rose-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {erroAplicacao}
              </div>
            )}

            {analise.problemas.length > 0 && (
              <div className="rounded-2xl border border-accent-200 bg-accent-50/60 px-3.5 py-3">
                <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-accent-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Corrija estes pontos antes de aplicar
                </div>
                <ul className="mt-2 space-y-1.5">
                  {analise.problemas.slice(0, 8).map((problema) => (
                    <li
                      key={`${problema.linha}-${problema.conteudo}`}
                      className="text-[10.5px] leading-relaxed text-ink-soft"
                    >
                      <span className="font-mono text-[9.5px] font-bold text-accent-700">
                        linha {problema.linha}
                      </span>{' '}
                      — {problema.mensagem}
                    </li>
                  ))}
                </ul>
                {analise.problemas.length > 8 && (
                  <p className="mt-1.5 text-[10px] font-medium text-accent-700">
                    + {analise.problemas.length - 8} problema(s) não exibido(s).
                  </p>
                )}
                {(analise.emailsDesconhecidos.length > 0 || analise.codigosDesconhecidos.length > 0) && (
                  <p className="mt-2 border-t border-accent-200/70 pt-2 text-[10px] leading-relaxed text-ink-muted">
                    {analise.emailsDesconhecidos.length > 0 && (
                      <>E-mails sem cadastro: {analise.emailsDesconhecidos.join(', ')}. </>
                    )}
                    {analise.codigosDesconhecidos.length > 0 && (
                      <>Códigos ausentes: {analise.codigosDesconhecidos.join(', ')}.</>
                    )}
                  </p>
                )}
              </div>
            )}

            {analise.validas.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-line">
                <div className="flex items-center justify-between border-b border-line-soft bg-paper-light px-3.5 py-2">
                  <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-muted">
                    <FileText className="h-3.5 w-3.5" />
                    Prévia
                  </span>
                  <span className="text-[10px] text-ink-muted">primeiras 10 linhas</span>
                </div>
                <div className="scrollbar-thin max-h-56 overflow-y-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-line-soft text-[9px] uppercase tracking-[0.08em] text-ink-muted">
                        <th className="px-3.5 py-2 font-bold">Avaliador</th>
                        <th className="px-3.5 py-2 font-bold">Trabalho</th>
                        <th className="px-3.5 py-2 font-bold">Linha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analise.validas.slice(0, 10).map((item) => (
                        <tr
                          key={`${item.linha}-${item.email}-${item.codigo}`}
                          className="border-b border-line-soft/60 last:border-0"
                        >
                          <td className="px-3.5 py-2">
                            <span className="block text-[10.5px] font-semibold text-ink">
                              {item.membro.nome}
                            </span>
                            <span className="block text-[9.5px] text-ink-muted">{item.email}</span>
                          </td>
                          <td className="px-3.5 py-2">
                            <span className="block font-mono text-[10.5px] font-bold text-brand-700">
                              {item.codigo}
                            </span>
                            <span className="line-clamp-1 block max-w-[360px] text-[9.5px] text-ink-muted">
                              {item.trabalho.titulo}
                            </span>
                          </td>
                          <td className="px-3.5 py-2 font-mono text-[9.5px] text-ink-muted">
                            {item.linha}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {!temTexto && (
          <div className="rounded-2xl border border-dashed border-line bg-paper-light px-4 py-6 text-center">
            <ClipboardPaste className="mx-auto h-6 w-6 text-ink-muted" />
            <p className="mt-2 text-[11.5px] font-medium text-ink-soft">
              Cole a lista ou carregue um CSV/TXT para ver a prévia.
            </p>
            <p className="mt-1 text-[10px] text-ink-muted">
              E-mails precisam estar cadastrados em Membros; códigos precisam existir em Trabalhos.
            </p>
          </div>
        )}

        <p className={classNames('text-[10px] leading-relaxed text-ink-muted', !temTexto && 'hidden')}>
          <strong>Importante:</strong> cadastrar o membro aqui não cria a senha. O acesso é criado em
          Supabase → Authentication → Users, com o mesmo e-mail. O vínculo é feito no primeiro login.
        </p>
      </div>
    </Modal>
  );
}
