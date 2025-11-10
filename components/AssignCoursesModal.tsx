import React, { useState, useEffect } from 'react';
import { User, Curso } from '../types';
import { XIcon } from './icons';
import { supabase } from '../services/supabaseClient';

interface AssignCoursesModalProps {
  student: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const Spinner: React.FC = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

export const AssignCoursesModal: React.FC<AssignCoursesModalProps> = ({ student, isOpen, onClose, onSaveSuccess }) => {
  const [courses, setCourses] = useState<Curso[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [initialEnrolledIds, setInitialEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && student) {
      const fetchData = async () => {
        setLoading(true);
        // Fetch all courses
        const { data: coursesData, error: coursesError } = await supabase.from('cursos').select('*').order('descricao');
        if (coursesError) console.error(coursesError);
        else setCourses(coursesData || []);

        // Fetch student's current enrollments
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('alunos_cursos')
          .select('curso_id')
          .eq('aluno_id', student.id);
        
        if (enrollmentError) console.error(enrollmentError);
        else {
          const ids = new Set(enrollmentData.map(e => e.curso_id));
          setEnrolledCourseIds(ids);
          setInitialEnrolledIds(ids);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const handleToggleCourse = (courseId: string) => {
    setEnrolledCourseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    
    const toAdd = [...enrolledCourseIds].filter(id => !initialEnrolledIds.has(id));
    const toRemove = [...initialEnrolledIds].filter(id => !enrolledCourseIds.has(id));

    // Prepare records for insertion
    const enrollmentsToAdd = toAdd.map(curso_id => ({
      aluno_id: student.id,
      curso_id,
    }));

    try {
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('alunos_cursos')
          .delete()
          .eq('aluno_id', student.id)
          .in('curso_id', toRemove);
        if (deleteError) throw deleteError;
      }

      if (enrollmentsToAdd.length > 0) {
        const { error: insertError } = await supabase.from('alunos_cursos').insert(enrollmentsToAdd);
        if (insertError) throw insertError;
      }
      
      await onSaveSuccess();
      onClose();
    } catch (error: any) {
      alert(`Erro ao salvar matrículas: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col border border-gray-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Matricular Aluno</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 bg-gray-50">
          <p className="mb-4">Selecione os cursos nos quais <span className="font-semibold">{student.name}</span> será matriculado.</p>
          {loading ? (
            <div className="text-center py-8">Carregando cursos...</div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-white rounded-md border border-gray-200">
              {courses.map(course => (
                <label key={course.id} className="flex items-center p-3 rounded-md hover:bg-blue-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={enrolledCourseIds.has(course.id)}
                    onChange={() => handleToggleCourse(course.id)}
                  />
                  <span className="ml-3 text-gray-800 font-medium">{course.descricao}</span>
                </label>
              ))}
              {courses.length === 0 && <p className="text-gray-500 text-center p-4">Nenhum curso cadastrado.</p>}
            </div>
          )}
        </div>
        <div className="flex justify-end p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 mr-3 bg-white border border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 transition-colors">Cancelar</button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="w-32 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center"
          >
            {saving ? <Spinner /> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};