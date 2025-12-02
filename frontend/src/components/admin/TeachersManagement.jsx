import { useState, useEffect } from 'react';
import { api } from '../../lib/apiClient';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, UserCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject_ids: [],
    password: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, subjectsRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/subjects'),
      ]);
      setTeachers(teachersRes.data);
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
      if (editMode) {
        await api.put(`/teachers/${currentTeacher.id}`, formData);
        toast.success('Teacher updated successfully!');
      } else {
        await api.post('/teachers', formData);
        toast.success('Teacher created successfully!');
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;

    try {
      await api.delete(`/teachers/${id}`);
      toast.success('Teacher deleted successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete teacher');
    }
  };

  const handleEdit = (teacher) => {
    setEditMode(true);
    setCurrentTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      subject_ids: teacher.subject_ids || [],
      password: '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentTeacher(null);
    setFormData({
      name: '',
      email: '',
      subject_ids: [],
      password: '',
    });
  };

  const getSubjectNames = (subjectIds) => {
    return subjectIds
      .map((id) => {
        const subject = subjects.find((s) => s.id === id);
        return subject ? subject.name : null;
      })
      .filter(Boolean)
      .join(', ');
  };

  const toggleSubject = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(subjectId)
        ? prev.subject_ids.filter(id => id !== subjectId)
        : [...prev.subject_ids, subjectId]
    }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Teachers Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditMode(false)} data-testid="add-teacher-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
              <DialogDescription>
                {editMode ? 'Update teacher information' : 'Create a new teacher account'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="teacher-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="teacher-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned Subjects</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {subjects.length === 0 ? (
                    <p className="text-sm text-gray-500">No subjects available. Create subjects first.</p>
                  ) : (
                    subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`subject-${subject.id}`}
                          checked={formData.subject_ids.includes(subject.id)}
                          onChange={() => toggleSubject(subject.id)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`subject-${subject.id}`} className="text-sm cursor-pointer">
                          {subject.name} ({subject.code})
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {!editMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="teacher-password-input"
                  />
                </div>
              )}
              <Button type="submit" className="w-full" data-testid="submit-teacher-button">
                {editMode ? 'Update Teacher' : 'Create Teacher'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No teachers found. Add your first teacher!</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Subjects</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-b">
                  <td className="py-3 px-4 font-medium">{teacher.name}</td>
                  <td className="py-3 px-4 text-gray-600">{teacher.email}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {getSubjectNames(teacher.subject_ids) || 'No subjects assigned'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(teacher)}
                        data-testid={`edit-teacher-${teacher.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(teacher.id)}
                        data-testid={`delete-teacher-${teacher.id}`}
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

export default TeachersManagement;