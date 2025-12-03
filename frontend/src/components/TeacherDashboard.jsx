import { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { LogOut, FileText, GraduationCap, CheckCircle, Clock, Eye, Search, Filter, Download, Save, Upload, CheckSquare, Trash2 } from 'lucide-react';
import PdfViewer from './PdfViewer';
import SimplifiedEvaluationInterface from './SimplifiedEvaluationInterface';

const TeacherDashboard = ({ user, onLogout }) => {
  const EXAM_TYPES = ['CA-1', 'CA-2', 'Mid Semester'];
  const [answerSheets, setAnswerSheets] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [questionMarks, setQuestionMarks] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradingMode, setGradingMode] = useState('question-wise'); // 'question-wise' or 'total'
  const [totalMarksInput, setTotalMarksInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExam, setFilterExam] = useState('all');
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    exam_type: '',
    subject_id: '',
    student_id: '',
    file: null,
  });
  const [selectedYear, setSelectedYear] = useState('');
  const [reuploadDialogOpen, setReuploadDialogOpen] = useState(false);
  const [reuploadSheet, setReuploadSheet] = useState(null);
  const [reuploadFile, setReuploadFile] = useState(null);
  const [reuploading, setReuploading] = useState(false);
  const [evaluationSheetId, setEvaluationSheetId] = useState(null);
  const [evaluationExamId, setEvaluationExamId] = useState(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [maskIdentity, setMaskIdentity] = useState(false);
  const [teacherSubjectIds, setTeacherSubjectIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // First, get teacher data to find teacher ID
      const teacherEmail = user.email;
      const teacherData = await api.get('/teachers');
      const currentTeacher = teacherData.data.find(t => t.email === teacherEmail);

      if (!currentTeacher) {
        toast.error('Teacher profile not found');
        setLoading(false);
        return;
      }

      // Fetch only data needed for this teacher - use teacher_id filter on server
      const [sheetsRes, studentsRes, examsRes, subjectsRes] = await Promise.all([
        api.get(`/answer-sheets?teacher_id=${currentTeacher.id}`),
        api.get('/students'),
        api.get('/exams'),
        api.get('/subjects'),
      ]);

      setAnswerSheets(sheetsRes.data);
      setStudents(studentsRes.data);
      setExams(examsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTeacherSubjectIds(Array.isArray(currentTeacher.subject_ids) ? currentTeacher.subject_ids : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown';
  };

  const getStudentRollNumber = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.roll_number : 'N/A';
  };

  const getExamDetails = (examId) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return { type: '', totalMarks: 0, subjectName: '', subjectId: '' };
    
    const subject = subjects.find(s => s.id === exam.subject_id);
    return {
      type: exam.exam_type,
      totalMarks: exam.total_marks,
      subjectName: subject ? subject.name : 'Unknown',
      subjectId: exam.subject_id,
    };
  };

  const getExamQuestions = (examId) => {
    const exam = exams.find(e => e.id === examId);
    return exam && Array.isArray(exam.questions) ? exam.questions : [];
  };

  const handleOpenGrade = (sheet) => {
    setSelectedSheet(sheet);
    const questions = getExamQuestions(sheet.exam_id);
    
    // Initialize marks from existing data or create new
    if (sheet.question_marks && sheet.question_marks.length > 0) {
      setQuestionMarks(sheet.question_marks.map(qm => ({
        question_number: qm.question_number,
        max_marks: qm.max_marks,
        marks_obtained: qm.marks_obtained || 0,
      })));
      setGradingMode('question-wise');
    } else {
      const initialMarks = questions.map((q) => ({
        question_number: q.question_number,
        max_marks: q.max_marks,
        marks_obtained: 0,
      }));
      setQuestionMarks(initialMarks);
      setGradingMode(questions.length > 0 ? 'question-wise' : 'total');
    }
    
    // Initialize total marks input if available
    if (sheet.marks_obtained !== null && sheet.marks_obtained !== undefined) {
      setTotalMarksInput(sheet.marks_obtained.toString());
    } else {
      setTotalMarksInput('');
    }
    
    setRemarks(sheet.remarks || '');
    setGradingDialogOpen(true);
  };

  const handleQuestionMarkChange = (index, value) => {
    setQuestionMarks((prev) => {
      const next = [...prev];
      const parsed = parseFloat(value || '0');
      const maxMarks = next[index].max_marks;
      const marksObtained = isNaN(parsed) ? 0 : Math.max(0, Math.min(maxMarks, parsed));
      next[index] = { ...next[index], marks_obtained: marksObtained };
      return next;
    });
  };

  const totalObtained = questionMarks.reduce((sum, q) => sum + (q.marks_obtained || 0), 0);
  const totalMax = questionMarks.reduce((sum, q) => sum + (q.max_marks || 0), 0);

  const handleGradeSubmit = async () => {
    if (!selectedSheet) return;

    const examDetails = getExamDetails(selectedSheet.exam_id);
    const maxMarks = examDetails.totalMarks;

    if (gradingMode === 'total') {
      // Validate total marks input
      const totalMarks = parseFloat(totalMarksInput);
      if (isNaN(totalMarks) || totalMarks < 0 || totalMarks > maxMarks) {
        toast.error(`Total marks must be between 0 and ${maxMarks}`);
        return;
      }

      setGrading(true);
      try {
        await api.put(`/answer-sheets/${selectedSheet.id}/grade`, {
          total_marks: Math.round(totalMarks),
          remarks: remarks || null,
        });

        toast.success('Marks submitted successfully!');
        setGradingDialogOpen(false);
        setSelectedSheet(null);
        setQuestionMarks([]);
        setTotalMarksInput('');
        setRemarks('');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to submit marks');
      } finally {
        setGrading(false);
      }
    } else {
      // Question-wise grading
      if (!questionMarks.length) {
        toast.error('No questions configured for this exam.');
        return;
      }

      // Validate marks
      for (const qm of questionMarks) {
        if (qm.marks_obtained < 0 || qm.marks_obtained > qm.max_marks) {
          toast.error(`Marks for question ${qm.question_number} must be between 0 and ${qm.max_marks}`);
          return;
        }
      }

      setGrading(true);
      try {
        await api.put(`/answer-sheets/${selectedSheet.id}/grade`, {
          question_marks: questionMarks,
          remarks: remarks || null,
        });

        toast.success('Marks submitted successfully!');
        setGradingDialogOpen(false);
        setSelectedSheet(null);
        setQuestionMarks([]);
        setTotalMarksInput('');
        setRemarks('');
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to submit marks');
      } finally {
        setGrading(false);
      }
    }
  };

  const handleDownloadPDF = async (sheetId) => {
    try {
      const response = await api.get(`/answer-sheets/${sheetId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `answer-sheet-${sheetId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handleExportMarksheet = async () => {
    if (filterExam === 'all') {
      toast.error('Select an exam to export');
      return;
    }
    
    // Show loading toast
    const toastId = toast.loading('Generating Excel report...');
    
    try {
      console.log('Starting export for exam:', filterExam);
      
      const response = await api.get(`/exams/${filterExam}/export-marksheet`, {
        responseType: 'blob',
      });
      
      console.log('Received response:', response);
      
      // Extract filename from Content-Disposition header
      const disposition = response.headers['content-disposition'] || '';
      let filename = 'Marksheet.xlsx';
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      if (match && match[1]) {
        filename = match[1];
      } else {
        // Fallback filename
        const timestamp = new Date().toISOString().split('T')[0];
        filename = `Marksheet_${filterExam}_${timestamp}.xlsx`;
      }
      
      console.log('Using filename:', filename);
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      console.log('Attempting download with link:', link);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Revoke the blob URL to free memory
      window.URL.revokeObjectURL(url);
      
      toast.success('Marksheet exported successfully!', { id: toastId });
    } catch (error) {
      console.error('Export error:', error);
      console.error('Error response:', error.response);
      
      // More detailed error handling
      let errorMessage = 'Export failed. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 404) {
          errorMessage = 'Exam not found. Please select a valid exam.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data) {
          errorMessage = error.response.data.detail || errorMessage;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadFormData.file) {
      toast.error('Please select a PDF file');
      return;
    }

    // Find or create exam for this subject and exam type
    const matchingExam = exams.find((exam) => {
      if (exam.exam_type !== uploadFormData.exam_type) return false;
      if (exam.subject_id !== uploadFormData.subject_id) return false;
      
      // If year filter is not set, match any exam
      if (!selectedYear) return true;
      
      // Match exam class_name with selected year, handling various formats
      if (exam.class_name) {
        const examClass = exam.class_name.toUpperCase();
        const yearFilter = selectedYear.toUpperCase();
        
        if (yearFilter === 'SY' && (examClass.includes('SY') || examClass.includes('SECOND'))) return true;
        if (yearFilter === 'TY' && (examClass.includes('TY') || examClass.includes('THIRD'))) return true;
        if (yearFilter === 'BE' && (examClass.includes('BE') || examClass.includes('BTECH') || examClass.includes('FINAL'))) return true;
      }
      
      return false;
    });

    if (!matchingExam) {
      toast.error(
        `No exam found for ${uploadFormData.exam_type} in the selected subject${selectedYear ? ` for ${selectedYear}` : ''}. ` +
        'Contact admin to create the exam first.'
      );
      return;
    }

    setUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('exam_id', matchingExam.id);
      formDataToSend.append('student_id', uploadFormData.student_id);
      formDataToSend.append('file', uploadFormData.file);

      await api.post('/answer-sheets/upload', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Answer sheet uploaded successfully!');
      setUploadDialogOpen(false);
      setUploadFormData({
        exam_type: '',
        subject_id: '',
        student_id: '',
        file: null,
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };
  const openReuploadDialog = (sheet) => {
    setReuploadSheet(sheet);
    setReuploadFile(null);
    setReuploadDialogOpen(true);
  };
  const handleReuploadSubmit = async (e) => {
    e.preventDefault();
    if (!reuploadFile || !reuploadSheet) {
      toast.error('Select a PDF file');
      return;
    }
    setReuploading(true);
    try {
      const fd = new FormData();
      fd.append('file', reuploadFile);
      await api.put(`/answer-sheets/${reuploadSheet.id}/reupload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReuploadDialogOpen(false);
      setReuploadSheet(null);
      setReuploadFile(null);
      toast.success('Answer sheet reuploaded');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Reupload failed');
    } finally {
      setReuploading(false);
    }
  };

  // Filter and search logic
  const filteredSheets = answerSheets.filter(sheet => {
    const studentName = getStudentName(sheet.student_id).toLowerCase();
    const rollNumber = getStudentRollNumber(sheet.student_id).toLowerCase();
    const examDetails = getExamDetails(sheet.exam_id);
    const examType = examDetails.type.toLowerCase();
    const subjectName = examDetails.subjectName.toLowerCase();
    
    const matchesSearch = searchTerm === '' || 
      studentName.includes(searchTerm.toLowerCase()) ||
      rollNumber.includes(searchTerm.toLowerCase()) ||
      examType.includes(searchTerm.toLowerCase()) ||
      subjectName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || sheet.status === filterStatus;
    const matchesExam = filterExam === 'all' || sheet.exam_id === filterExam;
    
    return matchesSearch && matchesStatus && matchesExam;
  });

  const pendingSheets = filteredSheets.filter(s => s.status === 'pending');
  const checkedSheets = filteredSheets.filter(s => s.status === 'checked');

  const groupedBySubjectAndType = (() => {
    const map = {};
    filteredSheets.forEach(sheet => {
      const d = getExamDetails(sheet.exam_id);
      const sid = d.subjectId || 'unknown';
      const t = d.type || 'Unknown';
      if (!map[sid]) map[sid] = {};
      if (!map[sid][t]) map[sid][t] = { pending: [], checked: [] };
      if (sheet.status === 'checked') {
        map[sid][t].checked.push(sheet);
      } else {
        map[sid][t].pending.push(sheet);
      }
    });
    return map;
  })();

  const pendingCount = answerSheets.filter(s => s.status === 'pending').length;
  const checkedCount = answerSheets.filter(s => s.status === 'checked').length;
  const totalCount = answerSheets.length;

  const handleCheckAnswerSheet = (sheet) => {
    setEvaluationSheetId(sheet.id);
    setEvaluationExamId(sheet.exam_id);
    setShowEvaluation(true);
  };

  const handleEvaluationSave = () => {
    fetchData(); // Refresh data after saving
  };

  const getMaskedStudentId = (studentId) => {
    // Generate a consistent anonymous ID based on student ID
    // This ensures the same student always gets the same anonymous ID
    if (!maskIdentity) {
      return getStudentName(studentId);
    }
    // Simple hash-like function to create consistent anonymous IDs
    const hash = studentId.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return `Student ${Math.abs(hash % 10000).toString().padStart(4, '0')}`;
  };

  const renderAnswerSheetRow = (sheet) => {
    const examDetails = getExamDetails(sheet.exam_id);
    const studentName = maskIdentity ? getMaskedStudentId(sheet.student_id) : getStudentName(sheet.student_id);
    const rollNumber = maskIdentity ? '***' : getStudentRollNumber(sheet.student_id);

    return (
      <tr key={sheet.id} className="border-b hover:bg-gray-50 transition-colors">
        <td className="py-4 px-4">
          <div>
            <div className="font-medium text-gray-900">{studentName}</div>
            <div className="text-sm text-gray-500">Roll: {rollNumber}</div>
          </div>
        </td>
        <td className="py-4 px-4">
          <div>
            <div className="font-medium text-gray-900">{examDetails.subjectName}</div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">{examDetails.type}</span>
          </div>
        </td>
        <td className="py-4 px-4">
          {sheet.status === 'checked' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Checked
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-800">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </span>
          )}
        </td>
        <td className="py-4 px-4">
          {sheet.marks_obtained !== null && sheet.marks_obtained !== undefined ? (
            <div className="font-semibold text-gray-900">
              {sheet.marks_obtained} / {examDetails.totalMarks}
              <div className="text-xs text-gray-500 mt-1">
                {((sheet.marks_obtained / examDetails.totalMarks) * 100).toFixed(1)}%
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Not graded</span>
          )}
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownloadPDF(sheet.id)}
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => handleCheckAnswerSheet(sheet)}
              title="Check Answer Sheet"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              Check Answer Sheet
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenGrade(sheet)}
              title={sheet.status === 'checked' ? 'View/Edit Grade' : 'Grade Paper'}
            >
              <Eye className="w-4 h-4 mr-1" />
              {sheet.status === 'checked' ? 'View' : 'Grade'}
            </Button>
            {sheet.status !== 'checked' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openReuploadDialog(sheet)}
                title="Reupload PDF"
              >
                <Upload className="w-4 h-4 mr-1" />
                Reupload
              </Button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderTypeSection = (type) => {
    const subjectIds = Object.keys(groupedBySubjectAndType).filter((sid) => groupedBySubjectAndType[sid][type]);
    const pendingTotal = subjectIds.reduce((acc, sid) => acc + (groupedBySubjectAndType[sid][type]?.pending.length || 0), 0);
    const checkedTotal = subjectIds.reduce((acc, sid) => acc + (groupedBySubjectAndType[sid][type]?.checked.length || 0), 0);

    if (subjectIds.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No answer sheets found for {type}</p>
        </div>
      );
    }

    const renderTable = (list) => (
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-3 px-4 font-semibold w-1/3">{maskIdentity ? 'Student ID' : 'Student'}</th>
            <th className="text-left py-3 px-4 font-semibold w-1/4">Exam</th>
            <th className="text-left py-3 px-4 font-semibold w-1/6">Status</th>
            <th className="text-left py-3 px-4 font-semibold w-1/6">Marks</th>
            <th className="text-left py-3 px-4 font-semibold w-1/6">Actions</th>
          </tr>
        </thead>
        <tbody>{list.map(renderAnswerSheetRow)}</tbody>
      </table>
    );

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">{type}</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Exam Type</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">Pending {pendingTotal}</div>
            <div className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Checked {checkedTotal}</div>
            <Button variant="ghost" size="sm" onClick={() => setMaskIdentity(!maskIdentity)} className="h-7 px-3 text-xs">{maskIdentity ? '👁️' : '🔒'}</Button>
          </div>
        </div>
        {subjectIds.map((sid) => {
          const subject = subjects.find(s => s.id === sid);
          const group = groupedBySubjectAndType[sid][type];
          return (
            <Card key={`${sid}-${type}`} className="border-0 shadow-md bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{subject ? subject.name : 'Unknown Subject'}</CardTitle>
                  <CardDescription>Pending {group.pending.length} • Checked {group.checked.length}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Card className="border rounded-lg">
                    <CardHeader className="py-2 px-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Pending</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{group.pending.length}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-0">
                      <div className="overflow-x-auto">{renderTable(group.pending)}</div>
                    </CardContent>
                  </Card>
                  <Card className="border rounded-lg">
                    <CardHeader className="py-2 px-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Checked</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{group.checked.length}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="px-0">
                      <div className="overflow-x-auto">{renderTable(group.checked)}</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50" data-testid="teacher-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Paper Checking Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Answer Sheet</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Answer Sheet</DialogTitle>
                    <DialogDescription>
                      Select exam type, optionally filter by year, then choose subject and student
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUploadSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="upload-exam">Exam Type</Label>
                      <Select
                        value={uploadFormData.exam_type}
                        onValueChange={(value) => setUploadFormData({ ...uploadFormData, exam_type: value })}
                        required
                      >
                        <SelectTrigger id="upload-exam">
                          <SelectValue placeholder="Select exam type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CA-1">CA-1</SelectItem>
                          <SelectItem value="CA-2">CA-2</SelectItem>
                          <SelectItem value="Mid Semester">Mid Semester</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upload-year">Year (Optional)</Label>
                      <Select
                        value={selectedYear || 'all'}
                        onValueChange={(value) => { 
                          // Handle "all" as empty string internally
                          const yearValue = value === 'all' ? '' : value;
                          setSelectedYear(yearValue); 
                          setUploadFormData({ ...uploadFormData, student_id: '', subject_id: '' }); 
                        }}
                      >
                        <SelectTrigger id="upload-year">
                          <SelectValue placeholder="All years" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          <SelectItem value="SY">Second Year (SY)</SelectItem>
                          <SelectItem value="TY">Third Year (TY)</SelectItem>
                          <SelectItem value="BE">Final Year (BE)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upload-subject">Subject</Label>
                      <Select
                        value={uploadFormData.subject_id}
                        onValueChange={(value) => setUploadFormData({ ...uploadFormData, subject_id: value })}
                        required
                      >
                        <SelectTrigger id="upload-subject">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const filteredSubjects = subjects.filter((subj) => {
                              // Must be assigned to teacher
                              if (!teacherSubjectIds.includes(subj.id)) return false;
                              
                              // If year filter is set, check if subject's class_name matches the year
                              if (selectedYear && subj.class_name) {
                                const className = subj.class_name.toUpperCase();
                                const yearFilter = selectedYear.toUpperCase();
                                
                                // Handle various class name formats:
                                // "SY-CSE", "TY-CSE", "BE-CSE" -> matches "SY", "TY", "BE"
                                // "BTech-CSE", "BTech" -> matches "BE" (BTech = Final Year)
                                // "Second Year", "Third Year", "Final Year" -> matches "SY", "TY", "BE"
                                
                                const matchesSY = yearFilter === 'SY' && (className.includes('SY') || className.includes('SECOND'));
                                const matchesTY = yearFilter === 'TY' && (className.includes('TY') || className.includes('THIRD'));
                                const matchesBE = yearFilter === 'BE' && (className.includes('BE') || className.includes('BTECH') || className.includes('FINAL'));
                                
                                if (!matchesSY && !matchesTY && !matchesBE) {
                                  return false;
                                }
                              }
                              
                              return true;
                            });
                            
                            // Sort subjects by name for better UX
                            const sortedSubjects = filteredSubjects.sort((a, b) => 
                              a.name.localeCompare(b.name)
                            );
                            
                            if (sortedSubjects.length === 0) {
                              return (
                                <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                                  No subjects assigned to you{selectedYear ? ` for ${selectedYear}` : ''}.
                                </div>
                              );
                            }
                            
                            return sortedSubjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name} ({subject.code}){subject.class_name ? ` - ${subject.class_name}` : ''}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upload-student">Student</Label>
                      <Select
                        value={uploadFormData.student_id}
                        onValueChange={(value) => setUploadFormData({ ...uploadFormData, student_id: value })}
                        required
                      >
                        <SelectTrigger id="upload-student">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students
                            .filter((s) => {
                              if (!selectedYear) return true;
                              if (!s.class_name) return false;
                              
                              const studentClass = s.class_name.toUpperCase();
                              const yearFilter = selectedYear.toUpperCase();
                              
                              // Handle various class name formats
                              if (yearFilter === 'SY' && (studentClass.includes('SY') || studentClass.includes('SECOND'))) return true;
                              if (yearFilter === 'TY' && (studentClass.includes('TY') || studentClass.includes('THIRD'))) return true;
                              if (yearFilter === 'BE' && (studentClass.includes('BE') || studentClass.includes('BTECH') || studentClass.includes('FINAL'))) return true;
                              
                              return false;
                            })
                            .map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} ({student.roll_number})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upload-file">PDF File</Label>
                      <Input
                        id="upload-file"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setUploadFormData({ ...uploadFormData, file: e.target.files[0] })}
                        required
                      />
                      <p className="text-xs text-gray-500">Only PDF files are allowed</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={uploading}>
                      {uploading ? 'Uploading...' : 'Upload Answer Sheet'}
                    </Button>
                  </form>
              </DialogContent>
            </Dialog>
            <Dialog open={reuploadDialogOpen} onOpenChange={setReuploadDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reupload Answer Sheet</DialogTitle>
                  <DialogDescription>
                    Replace the existing PDF for the selected student and exam
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleReuploadSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reupload-file">PDF File</Label>
                    <Input
                      id="reupload-file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setReuploadFile(e.target.files[0])}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={reuploading}>
                    {reuploading ? 'Reuploading...' : 'Reupload'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              onClick={onLogout}
              variant="outline"
              className="flex items-center space-x-2"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Assigned</p>
                  <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Checked</p>
                  <p className="text-3xl font-bold text-green-600">{checkedCount}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Answer Sheets Section */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Answer Sheets</CardTitle>
                <CardDescription>Review and grade student submissions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by student name, roll number, exam, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={filterExam} onValueChange={setFilterExam}>
                    <SelectTrigger className="w-full sm:w-[220px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by Exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Exams</SelectItem>
                      {exams.map(exam => {
                        const subject = subjects.find(s => s.id === exam.subject_id);
                        return (
                          <SelectItem key={exam.id} value={exam.id}>
                            {subject ? subject.name : 'Unknown'} - {exam.exam_type}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleExportMarksheet} disabled={filterExam === 'all'} title="Export marks to Excel">
                    <Download className="w-4 h-4 mr-2" /> Export Excel
                  </Button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading answer sheets...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your assigned sheets</p>
              </div>
            ) : filteredSheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No answer sheets found</p>
              </div>
            ) : (
              <Tabs defaultValue={EXAM_TYPES[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  {EXAM_TYPES.map((t) => (
                    <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
                  ))}
                </TabsList>
                {EXAM_TYPES.map((t) => (
                  <TabsContent key={t} value={t} className="mt-0">
                    {renderTypeSection(t)}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Evaluation Interface */}
      {showEvaluation && evaluationSheetId && evaluationExamId && (
        <SimplifiedEvaluationInterface
          sheetId={evaluationSheetId}
          examId={evaluationExamId}
          onClose={() => {
            setShowEvaluation(false);
            setEvaluationSheetId(null);
            setEvaluationExamId(null);
          }}
          onSave={handleEvaluationSave}
        />
      )}

      {/* Grading Dialog */}
      <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grade Answer Sheet</DialogTitle>
            <DialogDescription>
              {selectedSheet && (
                <>
                  Student: <strong>{getStudentName(selectedSheet.student_id)}</strong> ({getStudentRollNumber(selectedSheet.student_id)}) | 
                  Subject: <strong>{getExamDetails(selectedSheet.exam_id).subjectName}</strong> | 
                  Exam Type: <strong>{getExamDetails(selectedSheet.exam_id).type}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSheet && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {/* PDF Viewer */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Answer Sheet</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadPDF(selectedSheet.id)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ minHeight: '500px' }}>
                  <PdfViewer sheetId={selectedSheet.id} quality="fast" width={600} />
                </div>
              </div>

              {/* Grading Panel */}
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Grading</h3>
                    {/* Grading Mode Toggle */}
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm text-gray-600">Mode:</Label>
                      <Select value={gradingMode} onValueChange={setGradingMode}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="question-wise">Question-wise</SelectItem>
                          <SelectItem value="total">Total Marks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {gradingMode === 'total' ? (
                    /* Direct Total Marks Input */
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
                        <Label htmlFor="total-marks" className="text-sm font-semibold text-gray-700 mb-2 block">
                          Enter Total Marks
                        </Label>
                        <div className="flex items-center space-x-3">
                          <Input
                            id="total-marks"
                            type="number"
                            className="w-32 h-12 text-center text-2xl font-bold"
                            min="0"
                            max={getExamDetails(selectedSheet.exam_id).totalMarks}
                            step="0.5"
                            value={totalMarksInput}
                            onChange={(e) => setTotalMarksInput(e.target.value)}
                            placeholder="0"
                          />
                          <span className="text-xl font-semibold text-gray-600">
                            / {getExamDetails(selectedSheet.exam_id).totalMarks}
                          </span>
                        </div>
                        {totalMarksInput && !isNaN(parseFloat(totalMarksInput)) && (
                          <div className="mt-3 text-sm text-gray-600">
                            Percentage: <strong className="text-blue-600">
                              {((parseFloat(totalMarksInput) / getExamDetails(selectedSheet.exam_id).totalMarks) * 100).toFixed(1)}%
                            </strong>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        💡 Tip: Check the paper manually and enter the total marks directly.
                      </p>
                    </div>
                  ) : (
                    /* Question-wise Marks */
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Question-wise Marks</span>
                        <div className="text-sm text-gray-600">
                          Total: <span className="font-bold text-lg">{totalObtained}</span> / <span className="font-bold">{totalMax || getExamDetails(selectedSheet.exam_id).totalMarks}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                        {questionMarks.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No questions configured for this exam</p>
                        ) : (
                          questionMarks.map((qm, idx) => (
                            <div key={qm.question_number} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                              <div className="flex-1">
                                <Label className="text-sm font-medium">
                                  Question {qm.question_number}
                                </Label>
                                <div className="text-xs text-gray-500 mt-1">
                                  Max Marks: {qm.max_marks}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  className="w-24 h-10 text-center font-semibold"
                                  min="0"
                                  max={qm.max_marks}
                                  step="0.5"
                                  value={qm.marks_obtained}
                                  onChange={(e) => handleQuestionMarkChange(idx, e.target.value)}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (isNaN(val) || val < 0) {
                                      handleQuestionMarkChange(idx, '0');
                                    } else if (val > qm.max_marks) {
                                      handleQuestionMarkChange(idx, qm.max_marks.toString());
                                    }
                                  }}
                                />
                                <span className="text-gray-500">/ {qm.max_marks}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Total Marks Display */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-700">Total Marks:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            {totalObtained} / {totalMax || getExamDetails(selectedSheet.exam_id).totalMarks}
                          </span>
                        </div>
                        {totalMax > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            Percentage: <strong>{((totalObtained / totalMax) * 100).toFixed(1)}%</strong>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Remarks */}
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks / Feedback (Optional)</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Enter any remarks, feedback, or comments for the student..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-2">
                    <Button
                      onClick={handleGradeSubmit}
                      disabled={grading || (gradingMode === 'question-wise' && questionMarks.length === 0) || (gradingMode === 'total' && !totalMarksInput)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {grading ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {selectedSheet.status === 'checked' ? 'Update Grade' : 'Submit Grade'}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setGradingDialogOpen(false)}
                      disabled={grading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard;
