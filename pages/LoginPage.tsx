import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UserRole } from '../types';
import { 
  CheckCircle2, 
  Layers, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  ShieldCheck,
  HelpCircle,
  Globe,
  Chrome,
  Apple
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, registerUser, sendOtp, verifyOtp, companyInfo } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<'signup' | 'verify' | 'login'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setPasswordMatch(password === confirmPassword || !confirmPassword);
  }, [password, confirmPassword]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log('Iniciando registro para:', email);
      await registerUser(email, password, UserRole.ADMIN, fullName);
      setView('verify');
    } catch (err: any) {
      console.error('Erro no registro:', err);
      setError(err.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Por favor, insira o código completo.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const verified = await verifyOtp(email, code);
      if (verified) {
        // After verification, Supabase should have a session. 
        // We call login just to ensure local state is perfectly synced if needed, 
        // though onAuthStateChange handles most of it.
        const success = await login(email, password);
        if (success) {
          navigate('/', { replace: true });
        }
      } else {
        setError('Código inválido ou expirado. Por favor, tente novamente.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro na verificação. Tente reenviar o código.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const success = await login(email, password);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError('E-mail ou senha inválidos.');
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white flex flex-col md:flex-row font-sans text-gray-900">
      {/* Top Header - Mobile & Desktop */}
      <div className="absolute top-0 left-0 right-0 h-16 px-8 flex items-center justify-between z-10">
        <div className="font-bold text-lg tracking-tight uppercase">{companyInfo.name || 'MÃE & FILHO CONFECÇÃO'}</div>
        <div className="bg-indigo-600 text-white p-1 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
          <HelpCircle size={18} />
        </div>
      </div>

      {/* Left Panel: Branding & Features */}
      <div className="w-full md:w-1/2 bg-[#F8F9FF] p-8 md:p-16 flex flex-col justify-center relative overflow-hidden pt-24 md:pt-16">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>

        <div className="relative z-10 max-w-lg">
          {/* Logo Placeholder */}
          <div className="w-20 h-20 bg-black rounded-lg mb-8 flex items-center justify-center shadow-xl transform rotate-[-3deg]">
            {companyInfo.logo ? (
              <img src={companyInfo.logo} alt="Logo" className="w-14 h-14 object-contain" />
            ) : (
              <div className="text-white font-bold text-2xl flex flex-col items-center">
                <span className="text-[10px] leading-none opacity-60">M&F</span>
                <span className="text-xl">LOGO</span>
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-2 tracking-tight">
            MÃE & FILHO
          </h1>
          <p className="text-lg text-gray-500 mb-12 tracking-[0.2em] uppercase">Confecção</p>

          <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight">
            {view === 'verify' ? (
              <>Seu portal para <br /><span className="text-indigo-600 italic">gestão de alta costura.</span></>
            ) : (
              <>A tradição encontra <br />a eficiência <span className="text-indigo-600 italic underline decoration-wavy decoration-indigo-200">produtiva.</span></>
            )}
          </h2>

          <p className="text-gray-500 text-lg mb-12 max-w-sm leading-relaxed">
            {view === 'verify' ? 
              'Entre no limiar de um sistema de gestão robusto, projetado para quem valoriza a organização tanto quanto a qualidade das peças.' :
              'Gerencie sua confecção com precisão impecável. Da modelagem à entrega final, tenha o controle total da sua produção e clientes em um único lugar seguro.'
            }
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold mb-1">Gestão Integrada</h3>
              <p className="text-sm text-gray-400">Controle estoques, pedidos e clientes com inteligência.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Layers size={20} />
              </div>
              <h3 className="font-bold mb-1">Fluxo de Produção</h3>
              <p className="text-sm text-gray-400">Acompanhe cada etapa da sua confecção em tempo real.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Forms */}
      <div className="w-full md:w-1/2 bg-white p-8 md:p-24 flex flex-col justify-center items-center relative">
        <div className="w-full max-w-md">
          {view === 'signup' && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-bold mb-2 tracking-tight">Acessar Sistema</h2>
              <p className="text-gray-400 mb-8">Gerencie sua produção com eficiência máxima.</p>

              <form onSubmit={handleSignUp} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Alexandre Silva"
                    className="w-full px-5 py-4 bg-[#F8F9FF] border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@galeria.com.br"
                    className="w-full px-5 py-4 bg-[#F8F9FF] border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Senha</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-5 py-4 bg-[#F8F9FF] border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Confirmar</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-5 py-4 bg-[#F8F9FF] border-none rounded-xl focus:ring-2 transition-all placeholder:text-gray-300 ${!passwordMatch ? 'ring-2 ring-red-500' : 'focus:ring-indigo-500'}`}
                    />
                  </div>
                </div>

                <div className="flex items-center text-[11px] text-[#A66D4A] font-medium ml-1">
                  <span className="w-4 h-4 rounded-full bg-[#A66D4A] flex items-center justify-center mr-2 text-[8px] text-white">
                    <CheckCircle2 size={10} />
                  </span>
                  A senha atende aos requisitos de complexidade
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-xl text-lg font-bold shadow-lg shadow-indigo-100 transition-all transform active:scale-[0.98]"
                  isLoading={isLoading}
                >
                  Criar Conta
                </Button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300">
                  <span className="bg-white px-4">Ou continue com</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button className="flex items-center justify-center space-x-2 py-3 px-4 bg-[#F8F9FF] rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white p-0.5">
                    <img src="https://www.google.com/favicon.ico" className="w-full h-full invert" alt="" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Google</span>
                </button>
                <button className="flex items-center justify-center space-x-2 py-3 px-4 bg-[#F8F9FF] rounded-xl hover:bg-gray-100 transition-colors">
                  <Apple size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Apple</span>
                </button>
              </div>

              <p className="text-center text-gray-400 text-sm">
                Já tem uma conta? <button onClick={() => setView('login')} className="text-indigo-600 font-bold hover:underline">Entrar</button>
              </p>

              <div className="mt-12 bg-[#F8F9FF] p-6 rounded-2xl text-[10px] text-gray-400 leading-relaxed text-center">
                Ao clicar em "Criar Conta", você concorda com nossos <span className="text-gray-900 font-bold underline cursor-pointer">Termos de Serviço</span> e <span className="text-gray-900 font-bold underline cursor-pointer">Política de Privacidade</span>. Usamos criptografia para manter seus dados seguros.
              </div>
            </div>
          )}

          {view === 'verify' && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8">
                <Mail size={24} />
              </div>
              <h2 className="text-4xl font-bold mb-2 tracking-tight">Verifique seu e-mail</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Enviamos um código de 6 dígitos para <span className="text-gray-900 font-bold">{email.replace(/(.{1}).*(@.*)/, '$1***$2')}</span>
              </p>

              <form onSubmit={handleVerify} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 ml-1">Código de Verificação</label>
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-full h-16 bg-[#F8F9FF] border-none rounded-2xl text-center text-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-200"
                        placeholder="•"
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-xl text-lg font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center space-x-2"
                  isLoading={isLoading}
                >
                  <span>Verificar Acesso</span>
                  <ArrowRight size={20} />
                </Button>
              </form>

              <div className="mt-8 text-center text-sm">
                <p className="text-gray-400">Não recebeu o código? <button onClick={() => sendOtp(email)} className="text-indigo-600 font-bold hover:underline">Reenviar Código</button></p>
                <button onClick={() => setView('signup')} className="mt-6 flex items-center justify-center mx-auto text-gray-400 hover:text-gray-600 transition-colors">
                  <ArrowRight size={16} className="rotate-180 mr-2" />
                  <span>Voltar para o Registro</span>
                </button>
              </div>

              <div className="mt-16 bg-[#F8F9FF] p-6 rounded-2xl flex items-start space-x-4 border border-indigo-50">
                <div className="text-indigo-600 mt-1">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">Segurança em Primeiro Lugar</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Usamos criptografia padrão da indústria para proteger seus ativos visuais e dados pessoais.
                  </p>
                </div>
              </div>
            </div>
          )}

          {view === 'login' && (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <h2 className="text-4xl font-bold mb-2 tracking-tight">Bem-vindo(a)</h2>
              <p className="text-gray-400 mb-8">Faça login para gerenciar sua confecção.</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@galeria.com.br"
                    className="w-full px-5 py-4 bg-[#F8F9FF] border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Senha</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-5 py-4 bg-[#F8F9FF] border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-indigo-600">
                      <Lock size={18} />
                    </button>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-xl text-lg font-bold shadow-lg shadow-indigo-100"
                  isLoading={isLoading}
                >
                  Entrar
                </Button>
              </form>

              <p className="mt-8 text-center text-gray-400 text-sm">
                Ainda não tem conta? <button onClick={() => setView('signup')} className="text-indigo-600 font-bold hover:underline">Criar Conta</button>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-6 text-[10px] font-bold text-gray-300 uppercase tracking-widest px-8 text-center">
            <span className="hidden md:inline">© 2024 {companyInfo.name || 'MÃE & FILHO CONFECÇÃO'}. TODOS OS DIREITOS RESERVADOS.</span>
            <span className="hover:text-gray-600 cursor-pointer">Termos de Serviço</span>
            <span className="hover:text-gray-600 cursor-pointer">Política de Privacidade</span>
            <span className="hover:text-gray-600 cursor-pointer">Central de Ajuda</span>
        </div>
      </div>
    </div>
  );
};