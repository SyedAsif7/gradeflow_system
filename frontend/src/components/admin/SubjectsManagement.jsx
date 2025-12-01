import { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../App';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API}/subjects`);
      setSubjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        await axios.put(`${API}/subjects/${currentSubject.id}`, formData);
        toast.success('Subject updated successfully!');
      } else {
        await axios.post(`${API}/subjects`, formData);
        toast.success('Subject created successfully!');
      }

      fetchSubjects();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      await axios.delete(`${API}/subjects/${id}`);
      toast.success('Subject deleted successfully!');
      fetchSubjects();
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  const handleEdit = (subject) => {
    setEditMode(true);
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setCurrentSubject(null);
    setFormData({
      name: '',
      code: '',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Subjects Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditMode(false)} data-testid="add-subject-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
              <DialogDescription>
                {editMode ? 'Update subject information' : 'Create a new subject'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Mathematics, Physics"
                  data-testid="subject-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="e.g., MATH101, PHY201"
                  data-testid="subject-code-input"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="submit-subject-button">
                {editMode ? 'Update Subject' : 'Create Subject'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No subjects found. Add your first subject!</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Subject Name</th>
                <th className="text-left py-3 px-4">Subject Code</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id} className="border-b">
                  <td className="py-3 px-4 font-medium">{subject.name}</td>
                  <td className="py-3 px-4 text-gray-600">{subject.code}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(subject)}
                        data-testid={`edit-subject-${subject.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(subject.id)}
                        data-testid={`delete-subject-${subject.id}`}
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

export default SubjectsManagement;