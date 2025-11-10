
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
      if (isSignUp) {
        // Sign-up is now only for students. The profile is created automatically by the App component.
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmação antes de fazer login.');
        setIsSignUp(false); // Switch back to login view after successful signup
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      let friendlyMessage = 'Ocorreu um erro.';
      if (err.message.includes('Invalid login credentials')) {
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
        <img src="https://i.imgur.com/4I15n6c.png" alt="AprovaMed Logo" className="h-20 mx-auto mb-6" />
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