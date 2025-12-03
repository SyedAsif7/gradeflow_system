import { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { 
  CheckCircle2, XCircle, Minus, Plus, Undo2, Calculator, FileText, X 
} from 'lucide-react';
import PdfViewer from './PdfViewer';

const SimplifiedEvaluationInterface = ({ sheetId, examId, onClose, onSave }) => {
  const [sheet, setSheet] = useState(null);
  const [exam, setExam] = useState(null);
  const [subject, setSubject] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [questionMarks, setQuestionMarks] = useState({});
  const [history, setHistory] = useState([]);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    fetchSheetData();
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

  const handleQuestionSelect = (questionNum) => {
    setSelectedQuestion(questionNum);
  };

  const handleMarkChange = (questionNum, value) => {
    const question = exam.questions?.find(q => q.question_number === questionNum);
    if (!question) return;

    const maxMarks = question.max_marks || 10;
    const marksRaw = parseFloat(value) || 0;
    const marks = Math.max(0, Math.min(maxMarks, marksRaw));

    setQuestionMarks(prev => ({ ...prev, [questionNum]: marks }));
    setHistory(prev => [...prev, { action: 'update', question: questionNum, oldValue: prev[questionNum] || 0, newValue: marks }]);
  };

  const handleAnnotation = (annotationType) => {
    if (!selectedQuestion) {
      toast.error('Please select a question first');
      return;
    }

    // For simplicity, we'll just update the marks based on annotation type
    const question = exam.questions?.find(q => q.question_number === selectedQuestion);
    if (!question) return;

    let marksToAdd = 0;
    switch (annotationType) {
      case 'correct':
        marksToAdd = question.max_marks;
        break;
      case 'incorrect':
        marksToAdd = 0;
        break;
      case 'half':
        marksToAdd = question.max_marks / 2;
        break;
      default:
        return;
    }

    setQuestionMarks(prev => ({ ...prev, [selectedQuestion]: marksToAdd }));
    setHistory(prev => [...prev, { action: 'update', question: selectedQuestion, oldValue: prev[selectedQuestion] || 0, newValue: marksToAdd }]);
  };

  const handleUndo = () => {
    if (history.length === 0) {
      toast.info('Nothing to undo');
      return;
    }

    const lastAction = history[history.length - 1];
    if (lastAction.action === 'update') {
      setQuestionMarks(prev => ({ ...prev, [lastAction.question]: lastAction.oldValue }));
    }

    setHistory(prev => prev.slice(0, -1));
  };

  const calculateTotalScore = () => {
    const total = Object.values(questionMarks).reduce((sum, marks) => sum + (marks || 0), 0);
    const maxTotal = exam.questions?.reduce((sum, q) => sum + q.max_marks, 0) || exam.total_marks;
    
    return { total, maxTotal, percentage: maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(2) : 0 };
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
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-slate-700 to-slate-500 text-white">
          <div>
            <div className="flex items-center space-x-4">
              <Button variant="secondary" size="sm" onClick={onClose} className="bg-slate-600 hover:bg-slate-500">
                Back
              </Button>
              <div>
                <div className="text-sm font-medium">ID: {sheet?.student_id || '—'}</div>
                <div className="text-xs opacity-90">Subject: {subject ? subject.name : '—'}</div>
              </div>
            </div>
            <div className="text-xs mt-1">Exam: {exam.exam_type}</div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setShowQuestionPaper(!showQuestionPaper)} className="text-white hover:bg-white/20">
              <FileText className="w-4 h-4 mr-2" /> Question Paper
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Question Selection & Tools */}
          <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3">Questions</h3>
            
            {/* Question Selection */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2">
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
                      <span className="ml-1 text-xs opacity-75">({marks}/{q.max_marks})</span>
                    </Button>
                  );
                })}
              </div>
              
              {selectedQuestion && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                  <div className="font-semibold">Selected: Q{selectedQuestion}</div>
                  <div className="text-gray-600 mt-1">
                    Marks: 
                    <Input
                      type="number"
                      min="0"
                      max={exam.questions?.find(q => q.question_number === selectedQuestion)?.max_marks || 10}
                      step="0.5"
                      value={questionMarks[selectedQuestion] ?? ''}
                      onChange={(e) => handleMarkChange(selectedQuestion, e.target.value)}
                      className="w-16 ml-2 h-6 text-xs"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Annotation Tools */}
            <div className="space-y-2">
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAnnotation('correct')}
                disabled={!selectedQuestion}
              >
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Correct (Full Marks)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAnnotation('half')}
                disabled={!selectedQuestion}
              >
                <Minus className="w-4 h-4 mr-2 text-blue-600" /> Half Marks
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAnnotation('incorrect')}
                disabled={!selectedQuestion}
              >
                <XCircle className="w-4 h-4 mr-2 text-red-600" /> Incorrect (0 Marks)
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleUndo}
                disabled={history.length === 0}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Undo
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
                <Button
                  className="w-full mt-3 bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={() => {
                    const score = calculateTotalScore();
                    toast.success(`Total: ${score.total}/${score.maxTotal} (${score.percentage}%)`);
                  }}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Total
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center - PDF Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 text-sm text-gray-600 border-b">
              Answer Sheet Viewer
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
              <PdfViewer
                sheetId={sheetId}
              />
            </div>
          </div>

          {/* Right Sidebar - Question Details */}
          <div className="w-80 bg-white border-l p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3">Question Details</h3>
            
            {selectedQuestion ? (
              <div>
                <div className="mb-4">
                  <h4 className="font-medium">Question {selectedQuestion}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {exam.questions?.find(q => q.question_number === selectedQuestion)?.question_text || 'No question text available'}
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Max Marks: </span>
                    <span>{exam.questions?.find(q => q.question_number === selectedQuestion)?.max_marks || 0}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Awarded Marks
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={exam.questions?.find(q => q.question_number === selectedQuestion)?.max_marks || 10}
                    step="0.5"
                    value={questionMarks[selectedQuestion] ?? ''}
                    onChange={(e) => handleMarkChange(selectedQuestion, e.target.value)}
                    className="w-full"
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAnnotation('correct')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Full Marks
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAnnotation('half')}
                  >
                    <Minus className="w-4 h-4 mr-2 text-blue-600" /> Half Marks
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAnnotation('incorrect')}
                  >
                    <XCircle className="w-4 h-4 mr-2 text-red-600" /> Zero Marks
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a question to view details
              </div>
            )}
            
            {showQuestionPaper && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Question Paper</h3>
                <div className="space-y-3">
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
              </div>
            )}
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
          </div>
          <div className="flex items-center space-x-2">
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
      </div>
    </div>
  );
};

export default SimplifiedEvaluationInterface;