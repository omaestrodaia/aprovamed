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
import { useAcademicData } from './contexts/AcademicDataContext';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const { refetch: refetchAcademicData, clearData: clearAcademicData } = useAcademicData();

    const fetchUserProfile = useCallback(async (session: Session | null): Promise<User | null> => {
        if (!session?.user?.id || !session.user.email) {
            return null;
        }
    
        try {
            // Call the new, efficient database function instead of multiple client-side queries.
            const { data, error } = await supabase.rpc('get_user_profile', {
                user_id: session.user.id,
                user_email: session.user.email
            });
    
            if (error) {
                console.error("Error calling get_user_profile RPC:", error);
                throw error;
            }
    
            // The data from the RPC call is the complete user profile JSON.
            return data as User;
    
        } catch (error: any) {
             console.error("Critical error fetching user profile via RPC:", error);
             return null;
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        const timeoutId = setTimeout(() => {
            console.warn("Session loading timed out after 8 seconds. This could be a backend or network issue.");
            clearAcademicData();
            setSession(null);
            setUser(null);
            setLoading(false);
        }, 8000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                try {
                    const userProfile = await fetchUserProfile(session);
                    setSession(session);
                    setUser(userProfile);
                    
                    if (userProfile) {
                        await refetchAcademicData();
                    } else {
                        clearAcademicData();
                    }
                    
                    if (_event === 'SIGNED_OUT') {
                        setCurrentPage('dashboard');
                    }
                } catch (error) {
                    console.error("Error during auth state change handling:", error);
                    setUser(null);
                    setSession(null);
                    clearAcademicData();
                } finally {
                    clearTimeout(timeoutId);
                    setLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [fetchUserProfile, refetchAcademicData, clearAcademicData]);


    const handleLogout = async () => {
        await supabase.auth.signOut();
    };
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <img 
                    src="https://pub-872633efa2d545638be12ea86363c2ca.r2.dev/WhatsApp%20Image%202025-11-09%20at%2013.47.15.png" 
                    alt="AprovaMed Logo" 
                    className="h-32 w-auto animate-pulse" 
                />
            </div>
        );
    }

    if (!session || !user) {
        return <Auth />;
    }

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
            {pageToRender}
        </Layout>
    );
};

export default App;