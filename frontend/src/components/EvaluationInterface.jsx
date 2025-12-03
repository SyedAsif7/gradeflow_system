import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/apiClient';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import { 
  CheckCircle2, XCircle, Minus, Plus, Type, Undo2, Trash2, 
  Calculator, FileText, X, HelpCircle, ChevronRight, ChevronLeft 
} from 'lucide-react';
import PdfViewer from './PdfViewer';

const EvaluationInterface = ({ sheetId, examId, onClose, onSave }) => {
  const [sheet, setSheet] = useState(null);
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [questionMarks, setQuestionMarks] = useState({});
  const [history, setHistory] = useState([]); // For undo functionality
  const [redoStack, setRedoStack] = useState([]);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentPosition, setCommentPosition] = useState(null);
  const [awaitingCommentPlacement, setAwaitingCommentPlacement] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [mousePage, setMousePage] = useState(null);
  const pdfContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedAnnotation, setDraggedAnnotation] = useState(null);
  const [isDraggingExisting, setIsDraggingExisting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [filterSelectedOnly, setFilterSelectedOnly] = useState(false);
  const [visitedPages, setVisitedPages] = useState(new Set());
  const [timerStart, setTimerStart] = useState(Date.now());
  const [elapsed, setElapsed] = useState('00:00:00');
  const [networkSpeed, setNetworkSpeed] = useState(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionMax, setNewQuestionMax] = useState('');
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionMax, setEditQuestionMax] = useState('');
  const [savingQuestions, setSavingQuestions] = useState(false);

  useEffect(() => {
    fetchSheetData();
    checkFirstTimeUser();
    setTimerStart(Date.now());
  }, [sheetId]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !sheet || !exam) return;

    const autoSaveInterval = setInterval(async () => {
      if (annotations.length > 0 || Object.keys(questionMarks).length > 0) {
        try {
          const score = calculateTotalScore();
          const questionMarksList = exam.questions?.map(q => ({
            question_number: q.question_number,
            marks_obtained: questionMarks[q.question_number] || 0,
            max_marks: q.max_marks,
          })) || [];

          await api.put(`/answer-sheets/${sheetId}/grade`, {
            question_marks: questionMarksList,
            annotations: annotations,
            remarks: `Total: ${score.total}/${score.maxTotal} (${score.percentage}%)`,
          });

          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [annotations, questionMarks, autoSaveEnabled, sheet, exam, sheetId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+S or Cmd+S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveEvaluation();
      }
      // Number keys 1-9 for quick question selection
      if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const questionNum = parseInt(e.key);
        const question = exam?.questions?.find(q => q.question_number === questionNum);
        if (question) {
          setSelectedQuestion(questionNum);
          toast.info(`Selected Question ${questionNum}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [history, exam]);

  useEffect(() => {
    const t = setInterval(() => {
      const diff = Date.now() - timerStart;
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(t);
  }, [timerStart]);

  useEffect(() => {
    const conn = navigator.connection || navigator?.mozConnection || navigator?.webkitConnection;
    if (conn && typeof conn.downlink === 'number') {
      setNetworkSpeed(`${conn.downlink.toFixed(1)} Mbps`);
    } else {
      setNetworkSpeed(null);
    }
  }, []);

  const checkFirstTimeUser = () => {
    const hasSeenTour = localStorage.getItem('evaluation_tour_completed');
    if (!hasSeenTour) {
      setShowTour(true);
    }
  };

  const fetchSheetData = async () => {
    try {
      const [sheetRes, examRes] = await Promise.all([
        api.get(`/answer-sheets/${sheetId}?mask_identity=true`),
        api.get(`/exams/${examId}`)
      ]);
      setSheet(sheetRes.data);
      setExam(examRes.data);
      
      // Fetch subject details
      if (examRes.data.subject_id) {
        try {
          const subjectRes = await api.get(`/subjects/${examRes.data.subject_id}`);
          setSubject(subjectRes.data);
        } catch (err) {
          console.error('Failed to load subject:', err);
        }
      }
      
      // Initialize question marks from existing data
      if (sheetRes.data.question_marks && sheetRes.data.question_marks.length > 0) {
        const marks = {};
        sheetRes.data.question_marks.forEach(qm => {
          marks[qm.question_number] = qm.marks_obtained;
        });
        setQuestionMarks(marks);
      }
      
      // Initialize annotations if any
      if (sheetRes.data.annotations) {
        setAnnotations(sheetRes.data.annotations);
      }
    } catch (error) {
      toast.error('Failed to load answer sheet');
      console.error(error);
    }
  };

  useEffect(() => {
    if (!selectedQuestion || !exam?.questions) return;
    const q = exam.questions.find((qq) => qq.question_number === selectedQuestion);
    if (q) {
      setEditQuestionText(q.question_text || `Q${q.question_number}`);
      setEditQuestionMax(String(q.max_marks || 0));
    }
  }, [selectedQuestion, exam]);

  const updateExamQuestions = async (updated) => {
    try {
      setSavingQuestions(true);
      const payload = {
        subject_id: exam.subject_id,
        exam_type: exam.exam_type,
        date: exam.date,
        total_marks: exam.total_marks,
        class_name: exam.class_name,
        questions: updated.map((q, idx) => ({
          question_number: idx + 1,
          question_text: q.question_text || `Question ${idx + 1}`,
          max_marks: q.max_marks || 0,
        })),
      };
      const res = await api.put(`/exams/${examId}`, payload);
      setExam(res.data || { ...exam, questions: payload.questions });
      toast.success('Questions updated');
    } catch (error) {
      toast.error('Failed to update questions');
    } finally {
      setSavingQuestions(false);
    }
  };

  const handleAddQuestionEval = async () => {
    if (!newQuestionText.trim() || !newQuestionMax) return;
    const maxParsed = parseInt(newQuestionMax, 10) || 0;
    const max = Math.max(0, Math.min(10, maxParsed));
    const updated = [...(exam.questions || []), { question_text: newQuestionText.trim(), max_marks: max }];
    await updateExamQuestions(updated);
    setNewQuestionText('');
    setNewQuestionMax('');
  };

  const handleSaveEditedQuestion = async () => {
    if (!selectedQuestion) return;
    const maxParsed = parseInt(editQuestionMax, 10) || 0;
    const max = Math.max(0, Math.min(10, maxParsed));
    const updated = (exam.questions || []).map((q) =>
      q.question_number === selectedQuestion ? { ...q, question_text: editQuestionText.trim(), max_marks: max } : q
    );
    await updateExamQuestions(updated);
  };

  const annotationTypes = [
    { type: 'correct', icon: CheckCircle2, label: 'Correct', color: 'text-green-600' },
    { type: 'incorrect', icon: XCircle, label: 'Incorrect', color: 'text-red-600' },
    { type: 'half-mark', icon: Minus, label: 'Half Mark', color: 'text-blue-600' },
    { type: 'quarter-mark', icon: Minus, label: 'Quarter Mark', color: 'text-purple-600' },
    { type: 'na', icon: X, label: 'Not Attempted', color: 'text-gray-600' },
    { type: 'comment', icon: Type, label: 'Comment', color: 'text-orange-600' },
    { type: 'circle', icon: HelpCircle, label: 'Circle', color: 'text-blue-600' },
    { type: 'pen', icon: Minus, label: 'Pen', color: 'text-red-600' },
  ];

  const markButtons = [0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const handleQuestionSelect = (questionNum) => {
    setSelectedQuestion(questionNum);
  };

  const handleAnnotationClick = (annotationType) => {
    if (!selectedQuestion) {
      toast.error('Please select a question first');
      return;
    }

    if (annotationType === 'comment') {
      setCommentPosition(null);
      setAwaitingCommentPlacement(true);
      toast.info('Click on the PDF to place the comment');
      return;
    }

    if (annotationType === 'circle') {
      setDraggedAnnotation({ type: 'circle', question: selectedQuestion });
      setIsDragging(true);
      return;
    }

    if (annotationType === 'pen') {
      setDraggedAnnotation({ type: 'pen', question: selectedQuestion });
      setIsDragging(true);
      return;
    }

    setDraggedAnnotation({ type: annotationType, question: selectedQuestion });
    setIsDragging(true);
  };

  const handleAnnotationMouseDown = (annotation) => {
    setIsDraggingExisting(true);
    setDraggedAnnotation({ ...annotation });
  };

  const handlePageMouseMove = ({ pageNumber, x, y }) => {
    if (isDragging && draggedAnnotation) {
      setMousePage(pageNumber);
      setMousePosition({ x, y });
    }
    if (isDraggingExisting && draggedAnnotation) {
      setMousePage(pageNumber);
      setMousePosition({ x, y });
    }
    setVisitedPages(prev => new Set([...prev, pageNumber]));
  };

  const handlePageClick = ({ pageNumber, x, y }) => {
    if (awaitingCommentPlacement && selectedQuestion) {
      setCommentPosition({ x, y });
      setAwaitingCommentPlacement(false);
      setShowCommentDialog(true);
      return;
    }

    if (!isDragging || !draggedAnnotation) return;

    addAnnotation({
      type: draggedAnnotation.type,
      question_number: draggedAnnotation.question,
      x,
      y,
      page: pageNumber,
      value: draggedAnnotation.type === 'numeric' ? draggedAnnotation.value : undefined,
    });

    setIsDragging(false);
    setDraggedAnnotation(null);
    setMousePosition({ x: 0, y: 0 });
  };

  const handlePageMouseUp = ({ pageNumber, x, y }) => {
    if (!isDraggingExisting || !draggedAnnotation) return;
    const updated = { ...draggedAnnotation, x, y, page: pageNumber };
    setAnnotations((prev) => prev.map((ann) => (ann.id === updated.id ? updated : ann)));
    setHistory((prev) => [...prev, { action: 'move', annotationId: updated.id }]);
    setRedoStack([]);
    setIsDraggingExisting(false);
    setDraggedAnnotation(null);
    setMousePosition({ x: 0, y: 0 });
  };

  const addAnnotation = (annotationData) => {
    const newAnnotation = {
      id: `ann_${Date.now()}_${Math.random()}`,
      ...annotationData,
      created_at: new Date().toISOString(),
    };

    // Save to history for undo
    setHistory(prev => [...prev, { action: 'add', annotation: newAnnotation }]);
    setRedoStack([]);

    setAnnotations(prev => [...prev, newAnnotation]);

    // If it's a mark annotation, update question marks
    if (annotationData.type === 'half-mark' || annotationData.type === 'quarter-mark') {
      updateQuestionMarks(annotationData.question_number, annotationData.type);
    } else if (annotationData.type === 'na') {
      updateQuestionMarks(annotationData.question_number, 0);
    }
  };

  const handleDeleteAnnotation = (annotation) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== annotation.id));
    setHistory((prev) => [...prev, { action: 'delete_one', annotation }]);
    if (annotation.type === 'half-mark' || annotation.type === 'quarter-mark') {
      const question = exam.questions?.find((q) => q.question_number === annotation.question_number);
      if (question) {
        const delta = annotation.type === 'half-mark' ? question.max_marks / 2 : question.max_marks / 4;
        setQuestionMarks((prev) => {
          const current = prev[annotation.question_number] || 0;
          const next = Math.max(0, current - delta);
          return { ...prev, [annotation.question_number]: next };
        });
      }
    }
  };

  const updateQuestionMarks = (questionNum, annotationType) => {
    const question = exam.questions?.find(q => q.question_number === questionNum);
    if (!question) return;

    let marksToAdd = 0;
    if (annotationType === 'half-mark') {
      marksToAdd = question.max_marks / 2;
    } else if (annotationType === 'quarter-mark') {
      marksToAdd = question.max_marks / 4;
    }

    setQuestionMarks(prev => {
      const current = prev[questionNum] || 0;
      const newTotal = Math.min(current + marksToAdd, question.max_marks);
      return { ...prev, [questionNum]: newTotal };
    });
  };

  const handleNumericMark = (questionNum, value) => {
    const question = exam.questions?.find(q => q.question_number === questionNum);
    if (!question) return;

    const maxMarks = question.max_marks || 10;
    const marksRaw = parseFloat(value) || 0;
    const marks = Math.max(0, Math.min(maxMarks, marksRaw));
    if (marksRaw !== marks) {
      toast.error(`Marks must be between 0 and ${maxMarks}`);
    }

    setQuestionMarks(prev => ({ ...prev, [questionNum]: marks }));
    setHistory(prev => [...prev, { action: 'update', question: questionNum, oldValue: prev[questionNum] || 0, newValue: marks }]);
  };

  const handleUndo = () => {
    if (history.length === 0) {
      toast.info('Nothing to undo');
      return;
    }

    const lastAction = history[history.length - 1];
    if (lastAction.action === 'add') {
      setAnnotations(prev => prev.filter(ann => ann.id !== lastAction.annotation.id));
      setRedoStack(prev => [...prev, lastAction]);
    } else if (lastAction.action === 'update') {
      setQuestionMarks(prev => ({ ...prev, [lastAction.question]: lastAction.oldValue }));
      setRedoStack(prev => [...prev, lastAction]);
    } else if (lastAction.action === 'delete_one') {
      setAnnotations(prev => [...prev, lastAction.annotation]);
      setRedoStack(prev => [...prev, lastAction]);
      if (lastAction.annotation.type === 'half-mark' || lastAction.annotation.type === 'quarter-mark') {
        const question = exam.questions?.find((q) => q.question_number === lastAction.annotation.question_number);
        if (question) {
          const delta = lastAction.annotation.type === 'half-mark' ? question.max_marks / 2 : question.max_marks / 4;
          setQuestionMarks(prev => {
            const current = prev[lastAction.annotation.question_number] || 0;
            const next = Math.min(current + delta, question.max_marks);
            return { ...prev, [lastAction.annotation.question_number]: next };
          });
        }
      }
    } else if (lastAction.action === 'move' && lastAction.annotationId) {
      setAnnotations((prev) => prev);
      setRedoStack(prev => [...prev, lastAction]);
    }

    setHistory(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    if (last.action === 'add') {
      setAnnotations(prev => [...prev, last.annotation]);
    } else if (last.action === 'update') {
      setQuestionMarks(prev => ({ ...prev, [last.question]: last.newValue }));
    } else if (last.action === 'delete_one') {
      setAnnotations(prev => prev.filter(ann => ann.id !== last.annotation.id));
    }
    setHistory(prev => [...prev, last]);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const handleDeleteQuestion = (questionNum) => {
    // Remove all annotations for this question
    setAnnotations(prev => {
      const removed = prev.filter(ann => ann.question_number === questionNum);
      setHistory(prev => [...prev, { action: 'delete', annotations: removed }]);
      return prev.filter(ann => ann.question_number !== questionNum);
    });
    
    // Reset marks for this question
    setQuestionMarks(prev => {
      const oldValue = prev[questionNum] || 0;
      setHistory(prev => [...prev, { action: 'update', question: questionNum, oldValue, newValue: 0 }]);
      return { ...prev, [questionNum]: 0 };
    });

    toast.success(`All marks and annotations for Question ${questionNum} have been removed`);
  };

  const calculateTotalScore = () => {
    const total = Object.values(questionMarks).reduce((sum, marks) => sum + (marks || 0), 0);
    const maxTotal = exam.questions?.reduce((sum, q) => sum + q.max_marks, 0) || exam.total_marks;
    
    return { total, maxTotal, percentage: maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(2) : 0 };
  };

  const handleSaveComment = () => {
    if (!commentText.trim() || !selectedQuestion) return;

    addAnnotation({
      type: 'comment',
      question_number: selectedQuestion,
      x: commentPosition?.x || 0.5,
      y: commentPosition?.y || 0.5,
      page: mousePage || 1,
      value: commentText,
    });

    setCommentText('');
    setShowCommentDialog(false);
    setCommentPosition(null);
  };

  const handleAutoSave = async () => {
    try {
      const score = calculateTotalScore();
      
      // Convert question marks to the format expected by backend
      const questionMarksList = exam.questions?.map(q => ({
        question_number: q.question_number,
        marks_obtained: questionMarks[q.question_number] || 0,
        max_marks: q.max_marks,
      })) || [];

      await api.put(`/answer-sheets/${sheetId}/grade`, {
        question_marks: questionMarksList,
        annotations: annotations,
        remarks: `Total: ${score.total}/${score.maxTotal} (${score.percentage}%)`,
      });

      setLastSaved(new Date());
      // Silent save - no toast notification
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Silent failure for auto-save - don't show toast to avoid interrupting user
    }
  };

  const handleSaveEvaluation = async () => {
    try {
      const score = calculateTotalScore();
      
      // Convert question marks to the format expected by backend
      const questionMarksList = exam.questions?.map(q => ({
        question_number: q.question_number,
        marks_obtained: questionMarks[q.question_number] || 0,
        max_marks: q.max_marks,
      })) || [];

      await api.put(`/answer-sheets/${sheetId}/grade`, {
        question_marks: questionMarksList,
        annotations: annotations,
        remarks: `Total: ${score.total}/${score.maxTotal} (${score.percentage}%)`,
      });

      setLastSaved(new Date());
      toast.success('Evaluation saved successfully!');
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Save evaluation error:', error);
      const errorMessage = error.response?.data?.detail 
        || (typeof error.response?.data === 'string' ? error.response.data : null)
        || error.message 
        || 'Failed to save evaluation';
      toast.error(errorMessage);
    }
  };

  const tourSteps = [
    {
      title: 'Welcome to Evaluation Interface',
      content: 'This is your evaluation workspace. You can check answer sheets, add annotations, and assign marks here.',
    },
    {
      title: 'Select Questions',
      content: 'First, select a question number from the list to begin marking that question.',
    },
    {
      title: 'Annotation Tools',
      content: 'Use the annotation tools on the left to mark answers as correct, incorrect, or add partial marks.',
    },
    {
      title: 'Drag and Drop',
      content: 'Drag annotation icons onto the answer sheet to place them. Click on the PDF to place annotations.',
    },
    {
      title: 'Calculate Score',
      content: 'Click "Calculate Total Score" anytime to see the total marks and percentage.',
    },
    {
      title: 'Question Paper View',
      content: 'Click the question paper icon to view the complete question paper for reference.',
    },
  ];

  if (!sheet || !exam) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const score = calculateTotalScore();

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-slate-700 to-slate-500 text-white">
          <div>
            <div className="flex items-center space-x-2">
              <Button variant="secondary" size="sm" onClick={onClose} className="bg-slate-600 hover:bg-slate-500">Back</Button>
              <span className="text-sm">ID: {sheet?.student_id || '—'}</span>
              <span className="text-sm">Subject: {subject ? subject.name : '—'}</span>
            </div>
            <div className="text-xs opacity-90">Exam: {exam.exam_type}</div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time Taken: {elapsed}</div>
            <div className="text-sm">{networkSpeed ? networkSpeed : '—'}</div>
            <Button variant="ghost" size="sm" onClick={() => setShowQuestionPaper(!showQuestionPaper)} className="text-white hover:bg-white/20">
              <FileText className="w-4 h-4 mr-2" /> View Question Paper / Model Answer
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Annotation Tools */}
          <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3">Annotation</h3>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {markButtons.map((m) => (
                <button
                  key={`mark-${m}`}
                  className="h-10 w-10 rounded-full bg-white border shadow text-sm flex items-center justify-center hover:bg-blue-50"
                  title={`Mark ${m}`}
                  onClick={() => {
                    if (!selectedQuestion) {
                      toast.error('Please select a question first');
                      return;
                    }
                    setDraggedAnnotation({ type: 'numeric', question: selectedQuestion, value: String(m) });
                    setIsDragging(true);
                  }}
                >
                  {m === 0.5 ? '½' : m}
                </button>
              ))}
            </div>

            {/* Question Selection */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block">Select Question</Label>
              <div className="grid grid-cols-3 gap-2">
                {exam.questions?.map(q => {
                  const marks = questionMarks[q.question_number] || 0;
                  const isSelected = selectedQuestion === q.question_number;
                  return (
                    <Button
                      key={q.question_number}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleQuestionSelect(q.question_number)}
                      className={`text-xs relative ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
                      title={`Q${q.question_number}: ${marks}/${q.max_marks} marks`}
                    >
                      <span>Q{q.question_number}</span>
                      {marks > 0 && (
                        <span className="ml-1 text-xs opacity-75">({marks})</span>
                      )}
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                    </Button>
                  );
                })}
              </div>
              {selectedQuestion && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <div className="font-semibold">Selected: Q{selectedQuestion}</div>
                  <div className="text-gray-600">
                    Marks: {questionMarks[selectedQuestion] || 0} / {exam.questions?.find(q => q.question_number === selectedQuestion)?.max_marks || 0}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {annotationTypes.filter(a => ['correct','incorrect','circle','pen'].includes(a.type)).map(({ type, icon: Icon, label, color }) => (
                <button
                  key={type}
                  className="rounded-md bg-white border shadow px-3 py-2 text-sm flex items-center hover:bg-blue-50"
                  onClick={() => handleAnnotationClick(type)}
                  disabled={!selectedQuestion}
                >
                  <Icon className={`w-4 h-4 mr-2 ${color}`} /> {label}
                </button>
              ))}
              <button
                className="rounded-md bg-white border shadow px-3 py-2 text-sm flex items-center hover:bg-blue-50"
                onClick={handleUndo}
                disabled={history.length === 0}
              >
                <Undo2 className="w-4 h-4 mr-2" /> Undo
              </button>
              <button
                className="rounded-md bg-white border shadow px-3 py-2 text-sm flex items-center hover:bg-blue-50"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
              >
                <ChevronRight className="w-4 h-4 mr-2" /> Redo
              </button>
            </div>

            {/* Numeric Mark Input */}
            {selectedQuestion && (() => {
              const currentQ = exam.questions?.find(q => q.question_number === selectedQuestion);
              const maxMarks = currentQ?.max_marks || 10;
              return (
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Marks for Q{selectedQuestion}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={maxMarks}
                    step="0.5"
                    value={questionMarks[selectedQuestion] ?? ''}
                    onChange={(e) => handleNumericMark(selectedQuestion, e.target.value)}
                    className="w-full"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max: {maxMarks}
                  </p>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleUndo}
                disabled={history.length === 0}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Undo
              </Button>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Show annotations</Label>
                <input
                  type="checkbox"
                  checked={showAnnotations}
                  onChange={(e) => setShowAnnotations(e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Only selected question</Label>
                <input
                  type="checkbox"
                  checked={filterSelectedOnly}
                  onChange={(e) => setFilterSelectedOnly(e.target.checked)}
                />
              </div>
              {selectedQuestion && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteQuestion(selectedQuestion)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Q{selectedQuestion}
                </Button>
              )}
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                onClick={() => {
                  const score = calculateTotalScore();
                  toast.success(`Total: ${score.total}/${score.maxTotal} (${score.percentage}%)`);
                }}
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Total
              </Button>
            </div>

            {/* Score Summary */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Score Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">{score.total} / {score.maxTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Percentage:</span>
                    <span className="font-bold">{score.percentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - PDF Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 text-sm text-gray-600">Page Number: {mousePage || 1}</div>
            <div ref={pdfContainerRef} className="flex-1 overflow-auto bg-gray-100 p-4">
              {awaitingCommentPlacement && selectedQuestion && (
                <div className="mb-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-3 py-1 rounded shadow inline-block">
                  Click on the PDF to place comment for Q{selectedQuestion}
                </div>
              )}
              <PdfViewer
                sheetId={sheetId}
                onNumPagesChange={setNumPages}
                onClickPage={handlePageClick}
                onMouseMovePage={handlePageMouseMove}
                onMouseUpPage={handlePageMouseUp}
                renderAnnotations={(pageNumber) => (
                  <>
                    {isDragging && draggedAnnotation && mousePage === pageNumber && (
                      <div
                        className="absolute pointer-events-none z-10"
                        style={{
                          left: `${mousePosition.x * 100}%`,
                          top: `${mousePosition.y * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {draggedAnnotation.type === 'correct' && (
                          <CheckCircle2 className="w-12 h-12 text-green-600 opacity-75 drop-shadow-2xl" strokeWidth={3} />
                        )}
                        {draggedAnnotation.type === 'incorrect' && (
                          <XCircle className="w-12 h-12 text-red-600 opacity-75 drop-shadow-2xl" strokeWidth={3} />
                        )}
                        {draggedAnnotation.type === 'circle' && (
                          <div className="w-16 h-16 rounded-full border-[6px] border-blue-600 bg-transparent drop-shadow-2xl"></div>
                        )}
                        {draggedAnnotation.type === 'pen' && (
                          <div className="w-32 h-1 bg-red-600 drop-shadow-2xl"></div>
                        )}
                        {draggedAnnotation.type === 'half-mark' && (
                          <span className="text-blue-600 font-bold text-3xl opacity-75 drop-shadow-2xl">½</span>
                        )}
                        {draggedAnnotation.type === 'quarter-mark' && (
                          <span className="text-purple-600 font-bold text-3xl opacity-75 drop-shadow-2xl">¼</span>
                        )}
                        {draggedAnnotation.type === 'na' && (
                          <span className="text-gray-600 font-bold text-2xl opacity-75 drop-shadow-2xl">NA</span>
                        )}
                        {draggedAnnotation.type === 'numeric' && (
                          <div className="px-4 py-2 bg-white rounded-full shadow-2xl text-xl font-bold text-gray-800 border-2 border-gray-300">
                            {draggedAnnotation.value}
                          </div>
                        )}
                      </div>
                    )}
                    {showAnnotations && annotations
                      .filter(ann => ann.page === pageNumber)
                      .filter(ann => !filterSelectedOnly || ann.question_number === selectedQuestion)
                      .map(ann => (
                        <div
                          key={ann.id}
                          className="absolute z-10 hover:scale-110 transition-transform cursor-pointer"
                          style={{
                            left: `${ann.x * 100}%`,
                            top: `${ann.y * 100}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          title={`Q${ann.question_number} - ${ann.type}`}
                          onMouseDown={() => handleAnnotationMouseDown(ann)}
                          onDoubleClick={() => handleDeleteAnnotation(ann)}
                        >
                          {ann.type === 'correct' && (
                            <CheckCircle2 className="w-10 h-10 text-green-600 drop-shadow-2xl" strokeWidth={3} />
                          )}
                          {ann.type === 'incorrect' && (
                            <XCircle className="w-10 h-10 text-red-600 drop-shadow-2xl" strokeWidth={3} />
                          )}
                          {ann.type === 'circle' && (
                            <div className="w-16 h-16 rounded-full border-[6px] border-blue-600 bg-transparent drop-shadow-2xl"></div>
                          )}
                          {ann.type === 'pen' && (
                            <div className="w-32 h-1 bg-red-600 drop-shadow-2xl"></div>
                          )}
                          {ann.type === 'half-mark' && (
                            <span className="text-blue-600 font-bold text-2xl bg-white rounded-full px-3 py-2 drop-shadow-2xl border-2 border-blue-400">½</span>
                          )}
                          {ann.type === 'quarter-mark' && (
                            <span className="text-purple-600 font-bold text-2xl bg-white rounded-full px-3 py-2 drop-shadow-2xl border-2 border-purple-400">¼</span>
                          )}
                          {ann.type === 'na' && (
                            <span className="text-gray-600 font-bold text-xl bg-white rounded px-3 py-2 drop-shadow-2xl border-2 border-gray-400">NA</span>
                          )}
                          {ann.type === 'comment' && (
                            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 text-sm max-w-xs shadow-2xl">
                              <div className="font-bold text-yellow-800 mb-1">Q{ann.question_number}</div>
                              <div className="text-gray-700">{ann.value}</div>
                            </div>
                          )}
                          {ann.type === 'numeric' && (
                            <div className="px-4 py-2 bg-white rounded-full shadow-2xl text-xl font-bold text-gray-800 border-2 border-gray-300">
                              {ann.value} <span className="text-sm text-gray-500">(Q{ann.question_number})</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </>
                )}
              />
            </div>
          </div>

          {/* Right Sidebar - Question Palette */}
          <div className="w-80 bg-white border-l p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3">Questions</h3>
            <div className="grid grid-cols-3 text-xs font-semibold mb-2">
              <div>Questions</div>
              <div className="text-center">Out of</div>
              <div className="text-center">Evaluator Score</div>
            </div>
            <div className="space-y-2">
              {exam.questions?.map(q => (
                <div key={`qp-${q.question_number}`} className="grid grid-cols-3 items-center gap-2">
                  <div className={`text-sm cursor-pointer ${selectedQuestion === q.question_number ? 'font-bold text-blue-600' : ''}`} onClick={() => handleQuestionSelect(q.question_number)}>{q.question_text || `Q${q.question_number}`}</div>
                  <div className="text-sm text-center font-semibold">{q.max_marks || 0}</div>
                  <div>
                    <Input
                      type="number"
                      min={0}
                      max={q.max_marks || 10}
                      step="0.5"
                      value={questionMarks[q.question_number] ?? ''}
                      onChange={(e) => handleNumericMark(q.question_number, e.target.value)}
                      className="h-8 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <Label>Add Question</Label>
              <Input
                placeholder="Question label (e.g., Q1 A)"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                className="h-8 text-sm"
              />
              <Input
                type="number"
                min={0}
                max={10}
                placeholder="Max marks (0–10)"
                value={newQuestionMax}
                onChange={(e) => setNewQuestionMax(e.target.value)}
                className="h-8 text-sm"
              />
              <Button className="w-full" onClick={handleAddQuestionEval} disabled={savingQuestions || !newQuestionText.trim()}>
                Add Question
              </Button>
            </div>
            {selectedQuestion && (
              <div className="mt-4 space-y-2">
                <Label>Edit Selected</Label>
                <Input
                  placeholder="Question label"
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  min={0}
                  max={10}
                  placeholder="Max marks (0–10)"
                  value={editQuestionMax}
                  onChange={(e) => setEditQuestionMax(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button className="w-full" onClick={handleSaveEditedQuestion} disabled={savingQuestions}>
                  Save Changes
                </Button>
              </div>
            )}
            <div className="mt-3 space-y-2">
              <Button className="w-full bg-blue-600" onClick={() => {
                const s = calculateTotalScore();
                toast.success(`Total Score: ${s.total} / ${s.maxTotal}`);
              }}>
                <Calculator className="w-4 h-4 mr-2" /> Calculate Total Score
              </Button>
              <div className="grid grid-cols-1 gap-2">
                <Button className="w-full bg-green-600" onClick={handleSaveEvaluation}>Finish Paper</Button>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowQuestionPaper(true)}>
                <FileText className="w-4 h-4 mr-2" /> Question Paper
              </Button>
              {showQuestionPaper && (
                <div className="space-y-3 mt-2">
                  {exam.questions?.map(q => (
                    <Card key={`qpv-${q.question_number}`}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold">Question {q.question_number}</h4>
                          <span className="text-xs text-gray-500">{q.max_marks} marks</span>
                        </div>
                        <p className="text-xs text-gray-700">{q.question_text}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="font-semibold">Total Score: </span>
              <span className="text-lg font-bold text-blue-600">
                {score.total} / {score.maxTotal}
              </span>
              <span className="ml-2 text-gray-600">({score.percentage}%)</span>
            </div>
            {lastSaved && (
              <div className="text-xs text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>Auto-save:</span>
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`px-2 py-1 rounded ${autoSaveEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
              >
                {autoSaveEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="text-xs text-gray-500">
              <span className="font-semibold">Shortcuts:</span> Ctrl+Z (Undo), Ctrl+S (Save), 1-9 (Select Question)
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {Array.from({ length: numPages || 0 }, (_, i) => i + 1).map(p => {
              const hasAnn = annotations.some(a => a.page === p);
              const visited = visitedPages.has(p);
              const color = hasAnn ? 'bg-green-500' : visited ? 'bg-blue-500' : 'bg-red-500';
              return (
                <div key={`pg-${p}`} className={`h-5 w-5 rounded-full ${color} text-white text-xs flex items-center justify-center`} title={`Page ${p}`}>{p}</div>
              );
            })}
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              onClick={handleSaveEvaluation}
            >
              Save Evaluation
            </Button>
          </div>
        </div>

        {/* Tour Dialog */}
        {showTour && (
          <Dialog open={showTour} onOpenChange={setShowTour}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{tourSteps[tourStep]?.title}</DialogTitle>
                <DialogDescription>{tourSteps[tourStep]?.content}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.setItem('evaluation_tour_completed', 'true');
                    setShowTour(false);
                  }}
                >
                  Skip Tour
                </Button>
                <div className="flex space-x-2">
                  {tourStep > 0 && (
                    <Button variant="outline" onClick={() => setTourStep(tourStep - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                  )}
                  {tourStep < tourSteps.length - 1 ? (
                    <Button onClick={() => setTourStep(tourStep + 1)}>
                      Next <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        localStorage.setItem('evaluation_tour_completed', 'true');
                        setShowTour(false);
                      }}
                    >
                      Finish
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Comment Dialog */}
        {showCommentDialog && (
          <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Comment</DialogTitle>
                <DialogDescription>
                  Enter your comment for Question {selectedQuestion}
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your comment here..."
                rows={4}
                className="mt-4"
              />
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveComment} disabled={!commentText.trim()}>
                  Add Comment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default EvaluationInterface;

