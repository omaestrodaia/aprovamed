import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { Curso, Modulo, Disciplina, Assunto } from '../types';

interface AcademicData {
  cursos: Curso[];
  modulos: Modulo[];
  disciplinas: Disciplina[];
  assuntos: Assunto[];
  loading: boolean;
  refetch: () => Promise<void>;
  clearData: () => void;
}

const AcademicDataContext = createContext<AcademicData | undefined>(undefined);

export const AcademicDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<{
    cursos: Curso[];
    modulos: Modulo[];
    disciplinas: Disciplina[];
    assuntos: Assunto[];
  }>({ cursos: [], modulos: [], disciplinas: [], assuntos: [] });
  
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cursosRes, modulosRes, disciplinasRes, assuntosRes] = await Promise.all([
        supabase.from('cursos').select('*').order('descricao'),
        supabase.from('modulos').select('*').order('descricao'),
        supabase.from('disciplinas').select('*').order('descricao'),
        supabase.from('assuntos').select('*').order('descricao'),
      ]);

      if (cursosRes.error) throw cursosRes.error;
      if (modulosRes.error) throw modulosRes.error;
      if (disciplinasRes.error) throw disciplinasRes.error;
      if (assuntosRes.error) throw assuntosRes.error;
      
      setData({
          cursos: cursosRes.data || [],
          modulos: modulosRes.data || [],
          disciplinas: disciplinasRes.data || [],
          assuntos: assuntosRes.data || [],
      });
    } catch (error) {
      console.error("Failed to fetch academic data for context:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData({ cursos: [], modulos: [], disciplinas: [], assuntos: [] });
    setLoading(false);
  }, []);

  const value = { ...data, loading, refetch: fetchData, clearData };

  return (
    <AcademicDataContext.Provider value={value}>
      {children}
    </AcademicDataContext.Provider>
  );
};

export const useAcademicData = () => {
  const context = useContext(AcademicDataContext);
  if (context === undefined) {
    throw new Error('useAcademicData must be used within an AcademicDataProvider');
  }
  return context;
};
