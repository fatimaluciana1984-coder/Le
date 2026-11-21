import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Ocorreu um erro inesperado na aplicação.',
    };
  }

  render() {
    if (this.state.hasError) {
      let friendly = 'Não foi possível concluir esta operação no banco de dados.';
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error) {
          friendly = `Permissão ou validação recusada (${parsed.operationType}): ${parsed.error}`;
        }
      } catch {
        friendly = this.state.errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#fcf9f3] text-[#1c1c18] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#f6f3ed] border border-[#dec0b7] rounded-2xl p-8 space-y-5">
            <div className="w-12 h-12 rounded-xl bg-[#ffdbcf] text-[#9f3c16] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-editorial text-2xl font-semibold">Algo precisou de atenção</h2>
              <p className="text-sm text-[#57423b] leading-relaxed">{friendly}</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#9f3c16] text-white text-sm font-semibold hover:bg-[#bf542c] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Recarregar aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
