import { useState, useEffect } from 'react';
import { api } from '../../lib/apiClient';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, FileText, Download } from 'lucide-react';

const ExamsManagement = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    exam_type: '',
    date: '',
    total_marks: '',
    class_name: '',
    questions: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsRes, subjectsRes] = await Promise.all([
        api.get('/exams'),
        api.get('/subjects'),
      ]);
      setExams(examsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        total_marks: formData.questions.reduce((sum, q) => sum + (parseInt(q.max_marks || 0, 10) || 0), 0),
        questions: formData.questions.map((q, idx) => ({
          question_number: idx + 1,
          question_text: q.question_text || `Question ${idx + 1}`,
          max_marks: parseInt(q.max_marks || 0, 10) || 0,
        })),
      };

      if (editMode) {
        await api.put(`/exams/${currentExam.id}`, submitData);
        toast.success('Exam updated successfully!');
      } else {
        await api.post('/exams', submitData);
        toast.success('Exam created successfully!');
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;

    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete exam');
    }
  };

  const handleEdit = (exam) => {
    setEditMode(true);
    setCurrentExam(exam);
    setFormData({
      name: exam.name,
      subject_id: exam.subject_id,
      exam_type: exam.exam_type,
      date: exam.date,
      total_marks: exam.total_marks.toString(),
      class_name: exam.class_name,
      questions: (exam.questions || []).map((q) => ({
        question_text: q.question_text,
        max_marks: q.max_marks.toString(),
      })),
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentExam(null);
    setFormData({
      name: '',
      subject_id: '',
      exam_type: '',
      date: '',
      total_marks: '',
      class_name: '',
      questions: [],
    });
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : 'Unknown';
  };

  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question_text: '', max_marks: '' },
      ],
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setFormData((prev) => {
      const questions = [...prev.questions];
      questions[index] = {
        ...questions[index],
        [field]: value,
      };
      return { ...prev, questions };
    });
  };

  const totalFromQuestions = formData.questions.reduce(
    (sum, q) => sum + (parseInt(q.max_marks || 0, 10) || 0),
    0,
  );

  const handleExport = async (exam) => {
    try {
      const response = await api.get(`/exams/${exam.id}/export-marksheet`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exam.name.replace(/\s+/g, '_')}_Marksheet.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export marksheet');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Exams Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditMode(false)} data-testid="add-exam-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Exam
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Exam' : 'Add New Exam'}</DialogTitle>
              <DialogDescription>
                {editMode ? 'Update exam information' : 'Create a new exam'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Exam Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Mathematics Mid-Sem 2025"
                  data-testid="exam-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                  required
                >
                  <SelectTrigger data-testid="exam-subject-select">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam_type">Exam Type</Label>
                <Select
                  value={formData.exam_type}
                  onValueChange={(value) => setFormData({ ...formData, exam_type: value })}
                  required
                >
                  <SelectTrigger data-testid="exam-type-select">
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA-1">Class Test 1 (CA-1)</SelectItem>
                    <SelectItem value="CA-2">Class Test 2 (CA-2)</SelectItem>
                    <SelectItem value="Mid Semester">Mid Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Exam Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  data-testid="exam-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_marks">Total Marks</Label>
                <Input
                  id="total_marks"
                  type="number"
                  value={totalFromQuestions}
                  disabled
                  min="1"
                  placeholder="e.g., 100"
                  data-testid="exam-marks-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Questions (Question-wise evaluation)</Label>
                <div className="space-y-2 max-h-48 overflow-auto border rounded-md p-3">
                  {formData.questions.map((q, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                      <span className="col-span-1 text-sm font-medium">Q{idx + 1}</span>
                      <Input
                        className="col-span-3 h-8"
                        placeholder="Question text"
                        value={q.question_text}
                        onChange={(e) => handleQuestionChange(idx, 'question_text', e.target.value)}
                      />
                      <Input
                        className="col-span-2 h-8"
                        type="number"
                        min="0"
                        placeholder="Max marks"
                        value={q.max_marks}
                        onChange={(e) => handleQuestionChange(idx, 'max_marks', e.target.value)}
                      />
                    </div>
                  ))}
                  <Button type="button" size="sm" variant="outline" onClick={handleAddQuestion}>
                    Add Question
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class_name">Class</Label>
                <Input
                  id="class_name"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  required
                  placeholder="e.g., 10-A, 12-B"
                  data-testid="exam-class-input"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="submit-exam-button">
                {editMode ? 'Update Exam' : 'Create Exam'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No exams found. Add your first exam!</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Exam Name</th>
                <th className="text-left py-3 px-4">Subject</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Class</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Total Marks</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className="border-b">
                  <td className="py-3 px-4 font-medium">{exam.name}</td>
                  <td className="py-3 px-4 text-gray-600">{getSubjectName(exam.subject_id)}</td>
                  <td className="py-3 px-4">
                    <span className="badge badge-info">{exam.exam_type}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{exam.class_name}</td>
                  <td className="py-3 px-4 text-gray-600">{exam.date}</td>
                  <td className="py-3 px-4 text-gray-600">{exam.total_marks}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(exam)}
                        data-testid={`export-exam-${exam.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(exam)}
                        data-testid={`edit-exam-${exam.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(exam.id)}
                        data-testid={`delete-exam-${exam.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExamsManagement;