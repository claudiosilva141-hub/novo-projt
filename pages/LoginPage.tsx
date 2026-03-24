import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { fileToBase64 } from '../utils/base64Converter';
import { COMPANY_NAME_DEFAULT, ADMIN_USERNAME_DEFAULT, ADMIN_PASSWORD_DEFAULT } from '../constants'; // Import admin defaults
import { UserRole } from '../types'; // Import UserRole
import { UploadCloud, LogIn, User, Lock } from 'lucide-react'; // Example icons

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isInitialSetup, companyInfo, updateCompanyInfo, users, registerUser } = useAuth();
  const navigate = useNavigate();

  const [currentCompanyName, setCurrentCompanyName] = useState<string>(companyInfo.name);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(companyInfo.logo);
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Set default admin credentials for initial setup form
  useEffect(() => {
    if (isInitialSetup) { // Only pre-fill if it's the very first setup
      setUsername(ADMIN_USERNAME_DEFAULT);
      setPassword(ADMIN_PASSWORD_DEFAULT);
      setCurrentCompanyName(companyInfo.name || COMPANY_NAME_DEFAULT); // Ensure company name is also pre-filled or default
      setCompanyLogoPreview(companyInfo.logo);
    } else {
      setUsername('');
      setPassword('');
      // If not initial setup, ensure company name/logo state reflects current info (could be updated in settings)
      setCurrentCompanyName(companyInfo.name);
      setCompanyLogoPreview(companyInfo.logo);
    }
  }, [isInitialSetup, companyInfo.name, companyInfo.logo]);


  // Redirect if already authenticated and initial setup is complete
  useEffect(() => {
    if (isAuthenticated && !isInitialSetup) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isInitialSetup, navigate]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Only allow PNG for logo
      if (file.type === 'image/png') {
        setCompanyLogoFile(file);
        fileToBase64(file).then(setCompanyLogoPreview).catch(console.error);
        setError(null);
      } else {
        setCompanyLogoFile(null);
        setCompanyLogoPreview(null);
        setError('Por favor, selecione apenas arquivos PNG.');
      }
    } else {
      setCompanyLogoFile(null);
      setCompanyLogoPreview(null);
    }
  };

  const handleInitialSetupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    let logoBase64: string | null = companyLogoPreview;
    if (companyLogoFile) {
      try {
        logoBase64 = await fileToBase64(companyLogoFile);
      } catch (err) {
        setError('Erro ao converter imagem. Tente novamente.');
        setIsLoading(false);
        return;
      }
    }

    if (!currentCompanyName.trim()) {
      setError('O nome da empresa não pode estar vazio.');
      setIsLoading(false);
      return;
    }
    // Logo is now mandatory for initial setup
    if (!logoBase64) {
      setError('O logo da empresa é obrigatório para a configuração inicial.');
      setIsLoading(false);
      return;
    }
    if (!username.trim() || !password.trim()) {
      setError('E-mail e senha são obrigatórios.');
      setIsLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim())) {
      setError('Por favor, informe um e-mail válido.');
      setIsLoading(false);
      return;
    }
    if (users.some(u => u.username === username.trim())) {
      setError('Este e-mail já está cadastrado.');
      setIsLoading(false);
      return;
    }

    // Update company info via context (also saves to localStorage)
    updateCompanyInfo(currentCompanyName.trim(), logoBase64);
    registerUser(username.trim(), password.trim(), UserRole.ADMIN); // Register initial admin user
    const loginSuccess = await login(username.trim(), password.trim()); // Login the newly created admin
    if (loginSuccess) {
      navigate('/', { replace: true });
    } else {
      setError('Erro ao logar após a configuração inicial. Tente novamente.');
    }
    setIsLoading(false);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('E-mail e senha são obrigatórios.');
      setIsLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username.trim())) {
      setError('Por favor, informe um e-mail válido.');
      setIsLoading(false);
      return;
    }

    const loginSuccess = await login(username.trim(), password.trim());
    if (loginSuccess) {
      navigate('/', { replace: true });
    } else {
      setError('E-mail ou senha inválidos.');
    }
    setIsLoading(false);
  };


  return (
    <AuthLayout companyName={currentCompanyName} companyLogo={companyLogoPreview}>
      {isInitialSetup ? ( // Condition to show initial setup (no users exist yet)
        // Initial setup form
        <form onSubmit={handleInitialSetupSubmit} className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 text-center mb-4">Configuração Inicial da Empresa</h3>
          <p className="mt-2 text-center text-sm text-gray-600">
            Por favor, configure as informações básicas da sua empresa e crie o primeiro usuário administrador para começar.
          </p>
          <Input
            id="companyName"
            label="Nome da Empresa"
            type="text"
            value={currentCompanyName}
            onChange={(e) => setCurrentCompanyName(e.target.value)}
            placeholder={COMPANY_NAME_DEFAULT}
            required
          />

          <div>
            <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700 mb-1">
              Logo da Empresa (PNG) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative group hover:border-indigo-500 transition-colors cursor-pointer">
              <input
                id="companyLogo"
                name="companyLogo"
                type="file"
                accept="image/png"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                required // Logo is now required for initial setup
              />
              <div className="space-y-1 text-center">
                {companyLogoPreview ? (
                  <img src={companyLogoPreview} alt="Company Logo Preview" className="mx-auto h-20 w-auto object-contain rounded-full" />
                ) : (
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-600" />
                )}
                <div className="flex text-sm text-gray-600">
                  <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                    {companyLogoPreview ? 'Alterar logo' : 'Fazer upload de um arquivo'}
                  </span>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs text-gray-500">PNG de até 10MB</p>
              </div>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-800 text-center mt-6 mb-4">Criar Usuário Administrador</h3>
          <Input
            id="adminUsername"
            label="E-mail"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Seu e-mail profissional"
            required
            icon={<User className="h-5 w-5 text-gray-400" />}
          />
          <Input
            id="adminPassword"
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Escolha uma senha segura"
            required
            icon={<Lock className="h-5 w-5 text-gray-400" />}
          />

          {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}

          <div>
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              icon={<LogIn className="h-5 w-5" />}
            >
              Salvar e Entrar
            </Button>
          </div>
        </form>
      ) : (
        // Simple login form (after initial setup)
        <form onSubmit={handleLogin} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-4">Bem-vindo(a) de volta!</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
                Por favor, faça login para continuar.
            </p>
            <Input
              id="username"
              label="E-mail"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu e-mail"
              required
              icon={<User className="h-5 w-5 text-gray-400" />}
            />
            <Input
              id="password"
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
              icon={<Lock className="h-5 w-5 text-gray-400" />}
            />

            {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}

            <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                icon={<LogIn className="h-5 w-5" />}
            >
                Entrar
            </Button>
        </form>
      )}
    </AuthLayout>
  );
};