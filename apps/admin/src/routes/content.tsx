import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@repo/ui';
import { Plus, FileText, Edit, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/content')({
  component: ContentPage,
});

const mockContent = [
  { id: 1, title: 'Getting Started Guide', type: 'article', status: 'published', date: '2024-12-28' },
  { id: 2, title: 'API Documentation', type: 'docs', status: 'published', date: '2024-12-27' },
  { id: 3, title: 'Release Notes v2.0', type: 'article', status: 'draft', date: '2024-12-26' },
  { id: 4, title: 'Best Practices', type: 'guide', status: 'published', date: '2024-12-25' },
];

function ContentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Content</h2>
          <p className="text-muted-foreground">Manage your platform content</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Content
        </Button>
      </div>

      <div className="grid gap-4">
        {mockContent.map((item) => (
          <Card key={item.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-md bg-muted">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>
                  {item.type} • Last updated {item.date}
                </CardDescription>
              </div>
              <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                {item.status}
              </Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
