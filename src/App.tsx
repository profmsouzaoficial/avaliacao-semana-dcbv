import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppShell, type Aba } from './components/AppShell';
import { LoginScreen } from './components/LoginScreen';
import { EvaluationWorkspace } from './components/EvaluationWorkspace';
import { Dashboard } from './components/Dashboard';
import { CuradoriaView } from './components/CuradoriaView';
import { RegulamentoView } from './components/RegulamentoView';
import { Toast } from './components/Toast';
import { Brand } from './components/Brand';

function Carregando() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
      <Brand />
      <div className="mt-5 h-1 w-44 overflow-hidden rounded-full bg-line">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-600" />
      </div>
      <p className="mt-3 text-[11px] font-medium text-ink-muted">Preparando a bancada…</p>
    </div>
  );
}

function Conteudo() {
  const { pronto, membro } = useApp();
  const [aba, setAba] = useState<Aba>('avaliar');

  useEffect(() => {
    if (!membro) {
      setAba('avaliar');
      return;
    }
    setAba(membro.papel === 'presidente' ? 'painel' : 'avaliar');
  }, [membro?.id, membro?.papel]);

  if (!pronto) return <Carregando />;
  if (!membro) {
    return (
      <>
        <LoginScreen />
        <Toast />
      </>
    );
  }

  const presidente = membro.papel === 'presidente';

  return (
    <>
      <AppShell aba={aba} onAba={setAba}>
        {aba === 'avaliar' && <EvaluationWorkspace onAbrirPainel={() => setAba('painel')} />}
        {aba === 'painel' &&
          (presidente ? (
            <Dashboard onAbrirCuradoria={() => setAba('curadoria')} />
          ) : (
            <EvaluationWorkspace onAbrirPainel={() => setAba('painel')} />
          ))}
        {aba === 'curadoria' &&
          (presidente ? (
            <CuradoriaView />
          ) : (
            <EvaluationWorkspace onAbrirPainel={() => setAba('painel')} />
          ))}
        {aba === 'regulamento' && <RegulamentoView />}
      </AppShell>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Conteudo />
    </AppProvider>
  );
}
