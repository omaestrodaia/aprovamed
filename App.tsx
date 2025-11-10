import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { User } from './types';
import AdminDashboard from './pages/AdminDashboard';
import QuestionBank, { UploadQuestions } from './pages/QuestionBank';
import StudentManagement from './pages/StudentManagement';
import TestScheduling from './pages/TestScheduling';
import LearningPaths from './pages/LearningPaths';
import StudentDashboard from './pages/StudentDashboard';
import StudyArea from './pages/StudyArea';
import MyTests from './pages/MyTests';
import AcademicManagement from './pages/AcademicManagement';
import MaterialEstudo from './pages/MaterialEstudo';
import Auth from './pages/Auth';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('dashboard');

    const fetchUserProfile = useCallback(async (session: Session | null): Promise<User | null> => {
        if (!session?.user) {
            return null;
        }
    
        const userId = session.user.id;
    
        try {
            // 1. Check if user is an admin
            const { data: adminData, error: adminError } = await supabase.from('admins').select('*').eq('id', userId).maybeSingle();
            if (adminError) throw adminError;
            if (adminData) {
                return {
                    id: adminData.id,
                    name: adminData.name || session.user.email?.split('@')[0] || 'Admin',
                    email: adminData.email,
                    role: 'admin',
                    avatarUrl: adminData.avatar_url || `https://i.pravatar.cc/150?u=${adminData.id}`,
                    registrationDate: adminData.created_at,
                    status: 'active'
                };
            }
    
            // 2. If not admin, check if student profile exists
            const { data: studentData, error: studentError } = await supabase.from('alunos').select('*').eq('id', userId).maybeSingle();
            if (studentError) throw studentError;
            if (studentData) {
                return {
                    id: studentData.id,
                    name: studentData.name,
                    email: studentData.email,
                    role: 'student',
                    avatarUrl: studentData.avatar_url || `https://i.pravatar.cc/150?u=${studentData.id}`,
                    registrationDate: studentData.registration_date,
                    status: studentData.status
                };
            }
    
            // 3. If no profile exists, create one. Use upsert to handle potential race conditions gracefully.
            const newUserPayload = {
                id: userId,
                name: session.user.email?.split('@')[0] || 'Novo Aluno',
                email: session.user.email,
                status: 'active' as const,
            };
            const { data: newStudentData, error: upsertError } = await supabase
                .from('alunos')
                .upsert(newUserPayload)
                .select()
                .single();
            
            if (upsertError) {
                throw upsertError;
            }
            
            return {
                id: newStudentData.id,
                name: newStudentData.name,
                email: newStudentData.email,
                role: 'student',
                avatarUrl: newStudentData.avatar_url || `https://i.pravatar.cc/150?u=${newStudentData.id}`,
                registrationDate: newStudentData.registration_date,
                status: newStudentData.status
            };
    
        } catch (error: any) {
             console.error("Critical error fetching or creating user profile:", error);
             // Return null to allow the UI to redirect to the Auth page.
             return null;
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        // Failsafe timeout. If authentication takes too long, stop loading and show the login page.
        const timeoutId = setTimeout(() => {
            console.warn("Session loading timed out after 8 seconds. This could be a backend or network issue.");
            setLoading(false);
        }, 8000);
    
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                try {
                    // We received an auth event, so now we fetch the full user profile.
                    setSession(session);
                    const userProfile = await fetchUserProfile(session);
                    setUser(userProfile);
                    
                    if (_event === 'SIGNED_OUT') {
                        setCurrentPage('dashboard');
                    }
                } catch (error) {
                    console.error("Error during auth state change handling:", error);
                    // Ensure user state is cleared on error to prevent being stuck.
                    setUser(null);
                    setSession(null);
                } finally {
                    // Regardless of success or failure in fetching the profile, the auth process is complete.
                    // We can now clear the failsafe timeout and stop the loading screen.
                    clearTimeout(timeoutId);
                    setLoading(false);
                }
            }
        );
    
        return () => {
            subscription.unsubscribe();
            clearTimeout(timeoutId); // Cleanup on component unmount
        };
    }, [fetchUserProfile]);


    const handleLogout = async () => {
        await supabase.auth.signOut();
    };
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando Sessão...</div>;
    }

    if (!session || !user) {
        return <Auth />;
    }

    // FIX: Changed JSX.Element to React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
    const pages: Record<string, React.ReactElement> = {
        'dashboard': user.role === 'admin' ? <AdminDashboard setCurrentPage={setCurrentPage} /> : <StudentDashboard />,
        'upload-questions': <UploadQuestions />,
        'question-bank': <QuestionBank />,
        'academic-management': <AcademicManagement />,
        'study-material': <MaterialEstudo />,
        'students': <StudentManagement />,
        'tests': <TestScheduling />,
        'learning-paths': <LearningPaths />,
        'study-area': <StudyArea />,
        'my-tests': <MyTests />,
    };
    
    const pageToRender = pages[currentPage] || <div>Página não encontrada</div>;

    return (
        <Layout
            user={user}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onLogout={handleLogout}
        >
            <div style={{ display: currentPage === 'dashboard' ? 'block' : 'none' }}>{pages['dashboard']}</div>
            <div style={{ display: currentPage === 'upload-questions' ? 'block' : 'none' }}>{pages['upload-questions']}</div>
            <div style={{ display: currentPage === 'question-bank' ? 'block' : 'none' }}>{pages['question-bank']}</div>
            <div style={{ display: currentPage === 'academic-management' ? 'block' : 'none' }}>{pages['academic-management']}</div>
            <div style={{ display: currentPage === 'study-material' ? 'block' : 'none' }}>{pages['study-material']}</div>
            <div style={{ display: currentPage === 'students' ? 'block' : 'none' }}>{pages['students']}</div>
            <div style={{ display: currentPage === 'tests' ? 'block' : 'none' }}>{pages['tests']}</div>
            <div style={{ display: currentPage === 'learning-paths' ? 'block' : 'none' }}>{pages['learning-paths']}</div>
            <div style={{ display: currentPage === 'study-area' ? 'block' : 'none' }}>{pages['study-area']}</div>
            <div style={{ display: currentPage === 'my-tests' ? 'block' : 'none' }}>{pages['my-tests']}</div>
        </Layout>
    );
};

export default App;