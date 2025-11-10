import React, { useState, useEffect, useCallback } from 'react';
import { Curso, Modulo, Disciplina, Assunto, MaterialEstudo, FlashcardDeck, PracticeProgress } from '../types';
import { supabase } from '../services/supabaseClient';
import { generateFlashcardsForTopic } from '../services/geminiService';
import { SparklesIcon, BookOpenIcon, FolderKanbanIcon, FileQuestionIcon } from '../components/icons';
import { PracticeQuestionsModal } from '../components/PracticeQuestionsModal';


// Define interfaces for the nested structure returned by Supabase
type AssuntoWithContent = Assunto & {
    materiais_estudo: MaterialEstudo[];
    flashcard_decks: (FlashcardDeck & { assunto: { descricao: string } })[];
    questoes: { id: string }[]; // Simplified for counting
};
type DisciplinaWithContent = Disciplina & { assuntos: AssuntoWithContent[] };
type ModuloWithContent = Modulo & { disciplinas: DisciplinaWithContent[] };
type CourseWithContent = Curso & { modulos: ModuloWithContent[] };


const StudyArea: React.FC = () => {
    const [coursesWithContent, setCoursesWithContent] = useState<CourseWithContent[]>([]);
    const [allEnrolledAssuntos, setAllEnrolledAssuntos] = useState<AssuntoWithContent[]>([]);
    const [practiceProgress, setPracticeProgress] = useState<Map<string, PracticeProgress>>(new Map());
    const [loading, setLoading] = useState(true);
    
    // Flashcard generation
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedAssunto, setSelectedAssunto] = useState('');
    const [generationStatus, setGenerationStatus] = useState('');
    
    // Practice Questions Modal
    const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
    const [practiceAssuntoId, setPracticeAssuntoId] = useState<string | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");

            const { data: enrollments, error: enrollError } = await supabase
                .from('alunos_cursos')
                .select('curso_id')
                .eq('aluno_id', user.id);
            if (enrollError) throw enrollError;
            const courseIds = enrollments.map(e => e.curso_id);
            
            if (courseIds.length === 0) {
                setCoursesWithContent([]);
                setAllEnrolledAssuntos([]);
                setPracticeProgress(new Map());
                setLoading(false);
                return;
            }

            // --- START REFACTOR: Break down large query into smaller, more reliable ones ---

            // Fetch data in layers instead of one deep nested query to avoid timeouts
            const { data: courses, error: coursesError } = await supabase.from('cursos').select('*').in('id', courseIds);
            if (coursesError) throw coursesError;

            const { data: modulos, error: modulosError } = await supabase.from('modulos').select('*').in('curso_id', courseIds);
            if (modulosError) throw modulosError;
            const moduloIds = (modulos || []).map(m => m.id);

            const { data: disciplinas, error: discError } = await supabase.from('disciplinas').select('*').in('modulo_id', moduloIds);
            if (discError) throw discError;
            const disciplinaIds = (disciplinas || []).map(d => d.id);

            const { data: assuntosRaw, error: assuntosError } = await supabase.from('assuntos').select('*').in('disciplina_id', disciplinaIds);
            if (assuntosError) throw assuntosError;
            const assuntoIds = (assuntosRaw || []).map(a => a.id);

            // Fetch content for all assuntos in parallel
            const [materiaisRes, decksRes, questoesRes, progressRes] = await Promise.all([
                supabase.from('materiais_estudo').select('*').in('assunto_id', assuntoIds),
                supabase.from('flashcard_decks').select('*, assunto:assuntos(descricao)').in('assunto_id', assuntoIds),
                supabase.from('questoes').select('id, assunto_id').in('assunto_id', assuntoIds),
                supabase.from('pratica_assunto_progresso').select('*').eq('aluno_id', user.id).in('assunto_id', assuntoIds),
            ]);

            if (materiaisRes.error) throw materiaisRes.error;
            if (decksRes.error) throw decksRes.error;
            if (questoesRes.error) throw questoesRes.error;
            if (progressRes.error) throw progressRes.error;

            // Stitch data together client-side
            // FIX: Add `any` type to map/forEach callbacks to prevent 'unknown' type errors from Supabase data.
            const assuntosMap = new Map((assuntosRaw || []).map((a: any) => [a.id, { ...a, materiais_estudo: [], flashcard_decks: [], questoes: [] }]));
            (materiaisRes.data || []).forEach((m: any) => (assuntosMap.get(m.assunto_id) as any)?.materiais_estudo.push(m));
            (decksRes.data || []).forEach((d: any) => (assuntosMap.get(d.assunto_id) as any)?.flashcard_decks.push(d as any));
            (questoesRes.data || []).forEach((q: any) => (assuntosMap.get(q.assunto_id) as any)?.questoes.push(q as any));
            const assuntos = Array.from(assuntosMap.values());

            const disciplinasMap = new Map((disciplinas || []).map((d: any) => [d.id, { ...d, assuntos: [] }]));
            assuntos.forEach((a: any) => (disciplinasMap.get(a.disciplina_id) as any)?.assuntos.push(a as any));

            const modulosMap = new Map((modulos || []).map((m: any) => [m.id, { ...m, disciplinas: [] }]));
            Array.from(disciplinasMap.values()).forEach((d: any) => (modulosMap.get(d.modulo_id) as any)?.disciplinas.push(d as any));

            const stitchedCourses = (courses || []).map((c: any) => ({
                ...c,
                modulos: Array.from(modulosMap.values()).filter((m: any) => m.curso_id === c.id)
            }));
            
            // --- END REFACTOR ---

            setCoursesWithContent(stitchedCourses as CourseWithContent[]);
            setAllEnrolledAssuntos(assuntos as AssuntoWithContent[]);
            
            const progressMap = new Map<string, PracticeProgress>();
            (progressRes.data || []).forEach(p => progressMap.set(p.assunto_id, p));
            setPracticeProgress(progressMap);

            // Preserve selection or set default
            setSelectedAssunto(currentValue => {
                // FIX: Add `any` type to `a` and cast `assuntos[0]` to `any` to fix 'unknown' type errors.
                if (!currentValue || !assuntos.some((a: any) => a.id === currentValue)) {
                    return assuntos.length > 0 ? (assuntos[0] as any).id : '';
                }
                return currentValue;
            });

        } catch (error) {
            console.error("Error fetching study area data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleStartPractice = (assunto: AssuntoWithContent) => {
        setPracticeAssuntoId(assunto.id);
        setIsPracticeModalOpen(true);
    };

    const handleGenerateDecks = async () => {
        if (!selectedAssunto) return;
        setIsGenerating(true);
        setGenerationStatus('Gerando flashcards com IA...');
        try {
            const assunto = allEnrolledAssuntos.find(a => a.id === selectedAssunto);
            if (!assunto) throw new Error("Assunto não encontrado");

            const newCards = await generateFlashcardsForTopic(assunto.descricao);
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado para criar baralho.");

            const { data: deckData, error: deckError } = await supabase
                .from('flashcard_decks')
                .insert({ titulo: `Revisão de ${assunto.descricao}`, assunto_id: assunto.id, aluno_id: user.id })
                .select('*, assunto:assuntos(descricao)')
                .single();
            if (deckError) throw deckError;
            
            const cardsToInsert = newCards.map(card => ({ ...card, deck_id: deckData.id }));
            const { error: cardsError } = await supabase.from('flashcards').insert(cardsToInsert);
            if(cardsError) throw cardsError;
            
            setGenerationStatus(`Baralho "${deckData.titulo}" criado com sucesso!`);
            await fetchData(); // Refetch all data to update the UI
            setTimeout(() => setGenerationStatus(''), 5000);
        } catch (e: any) {
            setGenerationStatus('Erro ao gerar flashcards: ' + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {practiceAssuntoId && (
                 <PracticeQuestionsModal
                    isOpen={isPracticeModalOpen}
                    onClose={() => {
                        setIsPracticeModalOpen(false);
                        setPracticeAssuntoId(null);
                        fetchData(); // Refetch progress when modal closes
                    }}
                    assuntoId={practiceAssuntoId}
                />
            )}
           
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Área de Estudo</h1>
                <p className="text-gray-600 mt-1">Seu QG de aprendizado. Acesse trilhas, materiais e flashcards.</p>
            </header>

            {/* Flashcard Generator */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                 <h2 className="text-xl font-bold text-gray-800">Gerador de Flashcards</h2>
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium text-gray-700">Gerar baralho sobre:</label>
                        <select value={selectedAssunto} onChange={e => setSelectedAssunto(e.target.value)} disabled={allEnrolledAssuntos.length === 0 || isGenerating} className="w-full mt-1 p-2 border-gray-300 rounded-md disabled:bg-gray-100">
                            {allEnrolledAssuntos.map(a => <option key={a.id} value={a.id}>{a.descricao}</option>)}
                            {allEnrolledAssuntos.length === 0 && <option>Nenhum assunto disponível</option>}
                        </select>
                    </div>
                    <button onClick={handleGenerateDecks} disabled={isGenerating || allEnrolledAssuntos.length === 0} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50">
                        {isGenerating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <SparklesIcon className="w-5 h-5"/>}
                        Gerar com IA
                    </button>
                </div>
                {generationStatus && <p className={`text-sm ${generationStatus.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>{generationStatus}</p>}
            </div>

            {/* Courses Content */}
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold text-gray-900">Meus Cursos</h2>
                 {loading ? <p>Carregando conteúdo...</p> :
                 coursesWithContent.length > 0 ? (
                    coursesWithContent.map(course => {
                        const courseAssuntos = course.modulos.flatMap(m => m.disciplinas.flatMap(d => d.assuntos));
                        const allMaterials = courseAssuntos.flatMap(a => a.materiais_estudo);
                        const allDecks = courseAssuntos.flatMap(a => a.flashcard_decks);

                        return (
                            <div key={course.id} className="bg-white border border-gray-200 rounded-xl p-5">
                                <h3 className="text-2xl font-bold text-blue-600 mb-4">{course.descricao}</h3>
                                
                                <div className="space-y-6">

                                     <div>
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><FileQuestionIcon className="w-5 h-5 text-gray-500" /> Praticar com Questões</h4>
                                        {courseAssuntos.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {courseAssuntos.filter(a => a.questoes.length > 0).map(assunto => {
                                                    const progress = practiceProgress.get(assunto.id);
                                                    const answeredCount = progress?.questoes_respondidas.length || 0;
                                                    const totalCount = assunto.questoes.length;
                                                    const isCompleted = answeredCount === totalCount;

                                                    return (
                                                        <div key={assunto.id} className={`bg-gray-50 border p-3 rounded-lg flex items-center justify-between ${isCompleted ? 'border-green-300' : ''}`}>
                                                            <div>
                                                                <p className="font-bold text-gray-800">{assunto.descricao}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Respondidas: <span className="font-semibold">{answeredCount} / {totalCount}</span>
                                                                </p>
                                                            </div>
                                                            <button onClick={() => handleStartPractice(assunto)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                                                                {isCompleted ? 'Revisar' : 'Iniciar Prática'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                                {courseAssuntos.filter(a => a.questoes.length > 0).length === 0 && (
                                                     <p className="text-gray-500 text-sm">Nenhuma questão de prática disponível para os assuntos deste curso ainda.</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm">Nenhum assunto com questões de prática para este curso ainda.</p>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><BookOpenIcon className="w-5 h-5 text-gray-500" /> Materiais de Estudo</h4>
                                         {allMaterials.length > 0 ? (
                                            <ul className="space-y-2">
                                                {allMaterials.map(mat => (
                                                    <li key={mat.id} className="p-2 bg-gray-50 rounded-md hover:bg-gray-100">{mat.titulo} ({mat.tipo.toUpperCase()})</li>
                                                ))}
                                            </ul>
                                         ) : (
                                            <p className="text-gray-500 text-sm">Nenhum material de estudo encontrado para este curso.</p>
                                         )}
                                    </div>
                                    
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2"><FolderKanbanIcon className="w-5 h-5 text-gray-500" /> Meus Flashcards</h4>
                                        {allDecks.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {allDecks.map(deck => (
                                                    <div key={deck.id} className="bg-gray-50 border p-3 rounded-lg">
                                                        <p className="font-bold">{deck.titulo}</p>
                                                        <p className="text-sm text-gray-500">{deck.assunto?.descricao || 'Tópico Geral'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm">Nenhum baralho de flashcard encontrado para este curso.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                 ) : (
                    <div className="text-center py-10">
                        <p className="font-semibold text-gray-600">Você ainda não está matriculado em nenhum curso.</p>
                        <p className="text-gray-500">Peça ao administrador para te matricular em um curso para começar a estudar.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default StudyArea;