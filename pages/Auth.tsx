import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const authPromise = isSignUp
            ? supabase.auth.signUp({ email, password })
            : supabase.auth.signInWithPassword({ email, password });

        // Create a timeout promise that rejects after 30 seconds
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 30000)
        );
        
        // Race the authentication call against the timeout
        const result = await Promise.race([authPromise, timeoutPromise]);

        // If we reach here, the authPromise won. Check its result.
        const { error } = result as { error?: Error | null };

        if (error) {
            throw error; // Throw to be handled by the generic catch block
        }

        if (isSignUp) {
            alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmação antes de fazer login.');
            setIsSignUp(false);
        }
        // On successful login, onAuthStateChange in App.tsx will take over.
    } catch (err: any) {
        let friendlyMessage = 'Ocorreu um erro.';
        if (err.message === 'TIMEOUT') {
             friendlyMessage = 'O login demorou muito para responder. Verifique sua conexão ou tente novamente mais tarde.';
        } else if (err.message.includes('Invalid login credentials')) {
            friendlyMessage = 'E-mail ou senha inválidos. Por favor, tente novamente.';
        } else if (err.message.includes('User already registered')) {
            friendlyMessage = 'Este e-mail já está cadastrado. Tente fazer login.';
        } else if (err.message.includes('Password should be at least 6 characters')) {
            friendlyMessage = 'A senha deve ter pelo menos 6 caracteres.';
        } else {
            friendlyMessage = err.message;
        }
        setError(friendlyMessage);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="text-center mb-10">
        <img src="https://pub-872633efa2d545638be12ea86363c2ca.r2.dev/WhatsApp%20Image%202025-11-09%20at%2013.47.15.png" alt="AprovaMed Logo" className="h-20 mx-auto mb-6" />
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Sua plataforma de aprendizado inteligente. Faça login ou cadastre-se para começar.</p>
      </div>
      
      <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-xl shadow-lg">
        <div className="flex justify-center border-b mb-6">
            <button onClick={() => { setIsSignUp(false); setError(null); }} className={`py-2 px-6 font-semibold ${!isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Entrar</button>
            <button onClick={() => { setIsSignUp(true); setError(null); }} className={`py-2 px-6 font-semibold ${isSignUp ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Cadastrar</button>
        </div>
        
        <form onSubmit={handleAuthAction} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full p-3 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full p-3 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;